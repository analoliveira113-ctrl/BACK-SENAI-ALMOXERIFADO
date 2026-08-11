require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = Number(process.env.PORT || 3000);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  throw new Error("SUPABASE_URL e SUPABASE_KEY são obrigatórios no .env");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/* ============================
   CORS
============================ */

app.use(cors({
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "1mb" }));

/* ============================
   FUNÇÕES AUXILIARES
============================ */

const text = v =>
  typeof v === "string" ? v.trim() : v;

const error = (res, status, message) =>
  res.status(status).json({ error: message });

function code(v, field) {
  return typeof v === "string" && /^\d{3}$/.test(v)
    ? null
    : `${field} deve possuir exatamente 3 dígitos`;
}

function positive(v, field) {
  return Number.isInteger(Number(v)) && Number(v) > 0
    ? null
    : `${field} deve ser um inteiro maior que zero`;
}

function nonNegative(v, field) {
  return Number.isInteger(Number(v)) && Number(v) >= 0
    ? null
    : `${field} deve ser um inteiro maior ou igual a zero`;
}

/* ============================
   HEALTH CHECK
============================ */

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "senai-controle-estoque-api"
  });
});

/* ============================
   FAMÍLIAS
============================ */

app.get("/api/familias", async (_req, res) => {
  const { data, error: dbError } = await supabase
    .from("familias")
    .select("id,codigo,nome")
    .order("codigo");

  if (dbError) {
    console.error(dbError);
    return error(res, 500, "Erro ao listar famílias");
  }

  res.json(data);
});

app.post("/api/familias", async (req, res) => {
  const codigo = text(req.body.codigo);
  const nome = text(req.body.nome);

  const e = code(codigo, "codigo");

  if (e) {
    return error(res, 400, e);
  }

  if (!nome) {
    return error(res, 400, "Nome da família é obrigatório");
  }

  const { data, error: dbError } = await supabase
    .from("familias")
    .insert({
      codigo,
      nome
    })
    .select("id,codigo,nome")
    .single();

  if (dbError) {
    if (dbError.code === "23505") {
      return error(
        res,
        409,
        "Já existe uma família com esse código"
      );
    }

    console.error(dbError);

    return error(
      res,
      500,
      "Erro ao cadastrar família"
    );
  }

  res.status(201).json(data);
});

/* ============================
   TIPOS
============================ */

app.get("/api/tipos", async (req, res) => {
  const familiaCodigo = text(req.query.familia_codigo);

  if (!familiaCodigo) {
    return error(
      res,
      400,
      "familia_codigo é obrigatório"
    );
  }

  const e = code(
    familiaCodigo,
    "familia_codigo"
  );

  if (e) {
    return error(res, 400, e);
  }

  const {
    data: familia,
    error: familiaError
  } = await supabase
    .from("familias")
    .select("id")
    .eq("codigo", familiaCodigo)
    .maybeSingle();

  if (familiaError) {
    console.error(familiaError);

    return error(
      res,
      500,
      "Erro ao consultar família"
    );
  }

  if (!familia) {
    return error(
      res,
      404,
      "Família não encontrada"
    );
  }

  const {
    data,
    error: dbError
  } = await supabase
    .from("tipos")
    .select("id,familia_id,codigo,nome")
    .eq("familia_id", familia.id)
    .order("codigo");

  if (dbError) {
    console.error(dbError);

    return error(
      res,
      500,
      "Erro ao listar tipos"
    );
  }

  res.json(data);
});

app.post("/api/tipos", async (req, res) => {
  const familiaCodigo = text(
    req.body.familia_codigo
  );

  const codigo = text(req.body.codigo);
  const nome = text(req.body.nome);

  let e = code(
    familiaCodigo,
    "familia_codigo"
  );

  if (e) {
    return error(res, 400, e);
  }

  e = code(codigo, "codigo");

  if (e) {
    return error(res, 400, e);
  }

  if (!nome) {
    return error(
      res,
      400,
      "Nome do tipo é obrigatório"
    );
  }

  const {
    data: familia,
    error: familiaError
  } = await supabase
    .from("familias")
    .select("id")
    .eq("codigo", familiaCodigo)
    .maybeSingle();

  if (familiaError) {
    console.error(familiaError);

    return error(
      res,
      500,
      "Erro ao consultar família"
    );
  }

  if (!familia) {
    return error(
      res,
      404,
      "Família não encontrada"
    );
  }

  const {
    data,
    error: dbError
  } = await supabase
    .from("tipos")
    .insert({
      familia_id: familia.id,
      codigo,
      nome
    })
    .select("id,familia_id,codigo,nome")
    .single();

  if (dbError) {
    if (dbError.code === "23505") {
      return error(
        res,
        409,
        "Esse tipo já existe nessa família"
      );
    }

    console.error(dbError);

    return error(
      res,
      500,
      "Erro ao cadastrar tipo"
    );
  }

  res.status(201).json(data);
});

/* ============================
   PRODUTOS
============================ */

app.get("/api/produtos", async (req, res) => {
  const busca = text(
    req.query.busca ||
    req.query.search ||
    ""
  );

  let query = supabase
    .from("produtos")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (busca) {
    const termo = busca
      .slice(0, 100)
      .replace(/[%(),]/g, "");

    query = query.or(
      `sku.ilike.%${termo}%,nome.ilike.%${termo}%,localizacao.ilike.%${termo}%`
    );
  }

  const {
    data,
    error: dbError
  } = await query;

  if (dbError) {
    console.error(dbError);

    return error(
      res,
      500,
      "Erro ao listar produtos"
    );
  }

  res.json(data);
});

app.get("/api/produtos/:sku", async (req, res) => {
  const sku = text(req.params.sku);

  if (!/^\d{3}\.\d{3}\.\d{4}$/.test(sku)) {
    return error(
      res,
      400,
      "SKU inválido"
    );
  }

  const {
    data,
    error: dbError
  } = await supabase
    .from("produtos")
    .select("*")
    .eq("sku", sku)
    .maybeSingle();

  if (dbError) {
    console.error(dbError);

    return error(
      res,
      500,
      "Erro ao consultar produto"
    );
  }

  if (!data) {
    return error(
      res,
      404,
      "Produto não encontrado"
    );
  }

  res.json(data);
});

app.post("/api/produtos", async (req, res) => {
  const familiaCodigo = text(
    req.body.familia_codigo
  );

  const tipoCodigo = text(
    req.body.tipo_codigo
  );

  const nome = text(req.body.nome);

  const descricao = text(
    req.body.descricao || ""
  );

  const localizacao = text(
    req.body.localizacao
  );

  const quantidade = Number(
    req.body.quantidade ?? 0
  );

  const estoqueMinimo = Number(
    req.body.estoque_minimo ?? 1
  );

  let e = code(
    familiaCodigo,
    "familia_codigo"
  );

  if (e) {
    return error(res, 400, e);
  }

  e = code(tipoCodigo, "tipo_codigo");

  if (e) {
    return error(res, 400, e);
  }

  if (!nome) {
    return error(
      res,
      400,
      "Nome do produto é obrigatório"
    );
  }

  if (!localizacao) {
    return error(
      res,
      400,
      "Localização é obrigatória"
    );
  }

  e = nonNegative(
    quantidade,
    "quantidade"
  );

  if (e) {
    return error(res, 400, e);
  }

  e = nonNegative(
    estoqueMinimo,
    "estoque_minimo"
  );

  if (e) {
    return error(res, 400, e);
  }

  const {
    data,
    error: dbError
  } = await supabase.rpc(
    "criar_produto",
    {
      p_familia_codigo: familiaCodigo,
      p_tipo_codigo: tipoCodigo,
      p_nome: nome,
      p_descricao: descricao || null,
      p_localizacao: localizacao,
      p_quantidade: quantidade,
      p_estoque_minimo: estoqueMinimo
    }
  );

  if (dbError) {
    console.error(dbError);

    if (
      dbError.message.includes(
        "Família não encontrada"
      )
    ) {
      return error(
        res,
        404,
        "Família não encontrada"
      );
    }

    if (
      dbError.message.includes(
        "Tipo não encontrado"
      )
    ) {
      return error(
        res,
        404,
        "Tipo não encontrado para essa família"
      );
    }

    return error(
      res,
      500,
      "Erro ao cadastrar produto"
    );
  }

  res.status(201).json(data);
});

/* ============================
   MOVIMENTAÇÕES
============================ */

async function movimentacao(
  req,
  res,
  tipo
) {
  const sku = text(
    req.body.produto_sku
  );

  const quantidade = Number(
    req.body.quantidade
  );

  const responsavel = text(
    req.body.responsavel
  );

  const motivo = text(
    req.body.motivo || ""
  );

  if (
    !sku ||
    !/^\d{3}\.\d{3}\.\d{4}$/.test(sku)
  ) {
    return error(
      res,
      400,
      "produto_sku inválido"
    );
  }

  const e = positive(
    quantidade,
    "quantidade"
  );

  if (e) {
    return error(res, 400, e);
  }

  if (!responsavel) {
    return error(
      res,
      400,
      "Responsável é obrigatório"
    );
  }

  if (
    tipo === "SAIDA" &&
    !motivo
  ) {
    return error(
      res,
      400,
      "Motivo é obrigatório para saída"
    );
  }

  const {
    data,
    error: dbError
  } = await supabase.rpc(
    "registrar_movimentacao",
    {
      p_produto_sku: sku,
      p_tipo_movimentacao: tipo,
      p_quantidade: quantidade,
      p_responsavel: responsavel,
      p_motivo: motivo || null
    }
  );

  if (dbError) {
    console.error(dbError);

    if (
      dbError.message.includes(
        "Produto não encontrado"
      )
    ) {
      return error(
        res,
        404,
        "Produto não encontrado"
      );
    }

    if (
      dbError.message.includes(
        "Saldo insuficiente"
      )
    ) {
      return error(
        res,
        400,
        "Saldo insuficiente"
      );
    }

    return error(
      res,
      500,
      "Erro ao registrar movimentação"
    );
  }

  const result = Array.isArray(data)
    ? data[0]
    : data;

  res.status(201).json({
    produto: result?.produto,
    movimentacao: result?.movimentacao
  });
}

app.post(
  "/api/movimentacoes/entrada",
  (req, res) =>
    movimentacao(
      req,
      res,
      "ENTRADA"
    )
);

app.post(
  "/api/movimentacoes/saida",
  (req, res) =>
    movimentacao(
      req,
      res,
      "SAIDA"
    )
);

/* ============================
   HISTÓRICO
============================ */

app.get("/api/historico", async (_req, res) => {
  const {
    data,
    error: dbError
  } = await supabase
    .from("relatorio_movimentacoes")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (dbError) {
    console.error(dbError);

    return error(
      res,
      500,
      "Erro ao consultar histórico"
    );
  }

  res.json(data);
});

/* ============================
   ROTA NÃO ENCONTRADA
============================ */

app.use((_req, res) =>
  error(
    res,
    404,
    "Rota não encontrada"
  )
);

/* ============================
   SERVIDOR LOCAL
============================ */

if (require.main === module) {
  app.listen(
    PORT,
    () =>
      console.log(
        `API em http://localhost:${PORT}`
      )
  );
}

module.exports = { app };