# MVP do Atlas — Plano técnico

> **Status:** rascunho para aprovação
> **Base:** `spec.md` e `ARCH.md`. Este plano registra onde diverge da
> `ARCH.md` e por quê.

## 1. Repositórios

| Repositório | Conteúdo |
|---|---|
| `oAtlas` | Documentação (`CORE`, `ARCH`, `STYLE`, specs) e frontend web (Next.js). |
| `ortelius` | API FastAPI, domínio, acesso a PostGIS, migrations, pipeline de ingestão e configuração do painel editorial (Directus). |

**Por que o pipeline fica no `ortelius`:** compartilha modelo de domínio,
schemas e migrations com a API. Separar agora duplicaria o modelo sem
ganho. Fica como módulo (`ortelius/pipeline/`) executado por CLI, não
como serviço.

## 2. Contrato entre repositórios

- **Fonte da verdade:** OpenAPI gerado pelo FastAPI a partir dos schemas
  Pydantic.
- **Frontend:** gera tipos TypeScript e schemas Zod a partir do OpenAPI
  (ex.: `openapi-typescript` ou `orval`) e valida respostas em runtime.
- **Versionamento:** prefixo `/v1`. Mudança incompatível exige nova
  versão ou coordenação explícita entre os repositórios.
- **Falha:** se a resposta não bater com o schema Zod, o frontend trata
  como erro controlado do recurso (estado de erro do cartão, página ou
  camada), nunca como tela quebrada.

## 3. Decisões técnicas que este plano propõe

Cada item resolve um ponto em aberto da `ARCH.md` ou corrige um risco.

### 3.1 Convenção cronológica

`DATE` do PostgreSQL aceita a.C., mas datas aproximadas ("c. 500 a.C.",
"século III") não cabem em uma data civil, e o calendário proléptico
gera confusão.

**Proposta:** substituir `start_date`/`end_date`/`valid_from`/`valid_to`
por:
- `start_year INT` / `end_year INT` em **ano astronômico** (1 a.C. = 0,
  2 a.C. = −1);
- `date_precision` já previsto (`exact`, `approximate`, `century`,
  `range`, `unknown`);
- `start_label` / `end_label` para exibição ("c. 27 a.C.").

Mês/dia ficam fora do MVP; quando necessários, entram como colunas
opcionais. Conversão a.C./d.C. ↔ ano astronômico vive em um único módulo
de domínio, com testes nos limites (1 a.C. → 1 d.C.).

### 3.2 Geometrias

`entity_geometries` e `geo_features` se sobrepõem.

**Proposta para o MVP:**
- `entities.location geometry(Point, 4326)` opcional: posição de
  referência para busca, marcador e "voar até".
- `geo_features` concentra tudo o que é renderizado como camada
  (fronteiras, territórios), com camada, período e fonte.
- `entity_geometries` não é criada no MVP.

### 3.3 Distribuição geográfica

A `ARCH.md` prevê tiles vetoriais. **Risco:** CesiumJS não renderiza
vector tiles (MVT) nativamente; o formato nativo é 3D Tiles. Adotar MVT
no globo exigiria biblioteca de terceiros ou rasterização.

**Proposta para o MVP:**
- **Base cartográfica (países, admin-1, cidades, rótulos):** GeoJSON
  simplificado e pré-gerado por nível de detalhe, servido como arquivo
  estático via CDN. Volume pequeno; não precisa da API.
- **Camada histórica:** API `GET /v1/geography/features` com `bbox`,
  `year`, `layer` e `lod`, retornando GeoJSON a partir de geometrias
  **pré-simplificadas** no pipeline (uma coluna por LOD), com cache HTTP.
- **Tiles/3D Tiles:** reavaliar quando o volume medido justificar.

### 3.4 Conteúdo editorial

Editores não são técnicos, então o MVP precisa de painel. Construir um
admin próprio (auth, CRUD, editor de blocos, upload, rascunho/publicado)
é o item mais caro do MVP e não valida a hipótese.

**Proposta: Directus como painel editorial sobre o mesmo PostgreSQL.**
- Trabalha sobre o schema existente (introspecção), em vez de impor o
  seu. O schema continua sendo das migrations do `ortelius`.
- Entrega pronto: contas e papéis, CRUD, relações, upload de mídia,
  rascunho/publicado.
- Licença MSCL-1.0-GPL (desde a v12; antes BSL 1.1): sem limite de
  receita ou de funcionários; proíbe apenas o uso concorrente (oferecer o
  próprio Directus a terceiros). Uso interno é permitido. O Atlas se
  enquadra: editores usam o painel internamente e o público lê pela API
  do `ortelius`. Cada versão converte para GPL-3.0 após quatro anos.
- Sem chave de licença, a instância roda no plano **Core**: sem SSO
  (irrelevante, o acesso é por convite com e-mail e senha), sem IA e
  **sem regras de permissão personalizadas**, com limites numéricos de
  usuários e coleções não documentados oficialmente. Uma chave gratuita
  (organizações com menos de 50 funcionários e menos de US$ 5 mi de
  receita anual) amplia limites e recursos.
- **Decisão:** o MVP começa no Core. O spike da fase 2 confirma se ele
  basta (limite de usuários, quantidade de coleções e permissões por
  coleção suficientes para o papel Editor). Se não bastar, solicitar a
  chave gratuita antes do deploy (fase 8), condicionada ao enquadramento
  da organização, que é decisão de negócio.

**Regras para não acoplar o domínio ao CMS:**
- Migrations do `ortelius` (Alembic) são donas do schema. Directus não
  cria nem altera tabelas de domínio.
- Directus escreve; a API do `ortelius` lê. O frontend nunca chama o
  Directus diretamente.
- Validações que importam (publicar exige fonte, datas coerentes,
  slug único) ficam no banco (constraints, triggers) ou em uma etapa de
  validação do `ortelius`, não só no Directus. Assim sobrevivem a uma
  troca de CMS.
- Geometrias não são editadas no Directus; entram pelo pipeline.

**Alternativa descartada:** Payload CMS. Exige ser dono do schema, o que
inverte a relação com o `ortelius`.

**Riscos:**
- Tabelas `directus_*` no mesmo banco. Isolar em schema PostgreSQL
  próprio se o Directus permitir; senão, aceitar e documentar.
- Conteúdo das seções em JSONB: o editor de blocos do Directus precisa
  produzir o formato que o schema de blocos do `ortelius` valida.
  Validar isso na fase 2 antes de cadastrar volume.

### 3.5 Busca

PostgreSQL com `unaccent` + `pg_trgm` sobre `name` e aliases. Sem motor
de busca externo no MVP.

### 3.6 Segurança

- API pública do `ortelius` somente leitura e só enxerga conteúdo
  publicado.
- Escrita ocorre por dois caminhos: Directus (editores) e pipeline
  (geometrias). Cada um com usuário de banco próprio e permissões
  mínimas; a API usa um usuário só de leitura.
- Directus em domínio separado, contas apenas por convite, sem registro
  aberto.
- CORS restrito ao domínio do frontend, rate limit por IP e limites de
  `bbox`/página validados.
- Token do provedor de imagens com restrição de domínio.

### 3.7 Métricas de produto

Os sinais da spec §7.1 exigem analytics. Proposta: Umami ou Plausible
self-hosted, sem cookies e sem dados pessoais, o que dispensa banner de
consentimento e mantém os dados sob nosso controle.

Eventos mínimos: `page_view` com `entity_type` e `origin`
(`globe`, `relation`, `search`, `direct`). O `origin` é definido pelo
frontend no momento da navegação.

Falha: analytics fora não afeta o Atlas; o envio é assíncrono e
descartável.

## 4. Provedores e dados

| Necessidade | Candidato | Risco a validar |
|---|---|---|
| Satélite e terreno | Cesium ion (plano gratuito) | MVP não comercial é compatível. Validar cota de tráfego na fase 0. Uso comercial futuro exige plano pago ou troca de provedor. |
| Base mundial | Natural Earth | Domínio público. Baixo risco. |
| Lugares antigos | Pleiades | CC BY; exige atribuição. |
| Fronteiras históricas | A pesquisar (ex.: historical-basemaps) | Licença, precisão e procedência de cada geometria. **Maior risco de dados do MVP.** 6 recortes × região prioritária, cada geometria com fonte. |

A região prioritária é registrada como um polígono de cobertura por
período em `geo_features` (camada própria). O frontend usa esse polígono
para delimitar onde há dados e sinalizar "sem dados históricos" fora
dele. Expandir a cobertura depois é só ingerir novas geometrias e
ampliar o polígono, sem mudança de código.

## 5. Estrutura

### 5.1 `ortelius`

```text
ortelius/
  app/
    main.py
    api/v1/        entities, search, geography, layers
    domain/        entities, chronology, geography, sources
    repositories/
    schemas/
    infrastructure/database/
  pipeline/        ingestão, validação, simplificação, export estático
  migrations/      Alembic
  cms/             configuração e deploy do Directus
  tests/
```

### 5.2 `oAtlas` (web)

Segue `ARCH.md` §5.1, restrito a:
`globe/`, `entity/`, `features/{exploration,search,timeline,layers}`,
`domain/`, `adapters/cesium/`, `lib/api/`.
`adapters/maplibre/` não é criado no MVP.

## 6. Fases de entrega

Cada fase termina com algo demonstrável e pode ser revisada em uma
sessão.

| Fase | Entrega | Valida |
|---|---|---|
| 0 | POC Cesium: globo, satélite, terreno, rotação, zoom, medição de carga contra as metas de desempenho da spec §7 | Provedor, licença, desempenho |
| 1 | `ortelius` base: FastAPI, PostGIS, migrations, convenção cronológica, `/v1/entities/{slug}` | Modelo de dados |
| 2 | Directus sobre o schema + editor não técnico cadastra 5 entidades reais | Fluxo editorial e formato de blocos |
| 3 | Página imersiva com seções, relações e fontes | "Conhecer" e "Relacionar" |
| 4 | Base cartográfica estática + marcadores + cartão de prévia | "Explorar" |
| 5 | Busca com aliases | Jornadas 4 e 5 |
| 6 | Camada História + linha do tempo compacta + 1 período | Jornada 2 |
| 7 | Demais períodos + volume de conteúdo da spec | Lançamento |
| 8 | Desempenho, atribuições, estados de erro, analytics, deploy | Critérios de aceite |

## 7. Testes

- **`ortelius`:** pytest. Prioridade: conversão cronológica, filtros
  espaciais e temporais contra PostGIS real (container), validação do
  conteúdo, contratos de erro da API.
- **Web:** Vitest para adaptador cartográfico e estado de exploração;
  Playwright para as cinco jornadas da spec.
- **Contrato:** CI do frontend falha se o OpenAPI gerado mudar sem
  regenerar os tipos.

## 8. Como pode falhar

| Falha | Comportamento esperado |
|---|---|
| Provedor de satélite fora ou cota estourada | Globo cai para imagem base local de baixa resolução e exibe aviso discreto. |
| API fora | Globo e base cartográfica estática continuam; camada histórica, busca e páginas mostram erro com nova tentativa. |
| API lenta | Timeout explícito no cliente; requisições de viewport antigas são canceladas ao mover a câmera. |
| Contrato mudou | Validação Zod falha → erro controlado no recurso, registrado no log. |
| Geometria histórica inválida | Pipeline rejeita na ingestão (`ST_IsValid`, SRID, período coerente); nunca chega ao banco publicado. |
| Conteúdo sem fonte | Constraint/validação no banco recusa publicar, independentemente do CMS. |
| Directus fora | Atlas continua no ar (API lê direto do banco); só a edição para. |
| Editor salva bloco em formato inválido | Validação do `ortelius` rejeita a seção na leitura e loga; a página renderiza as demais seções. |
| GPU fraca / WebGL indisponível | Detectar e oferecer modo sem globo (busca + páginas). |

## 9. Questões em aberto

Técnicas, para decidir durante a execução:

1. Hospedagem do frontend, da API, do Directus e do PostGIS, e
   orçamento mensal.
2. CDN e armazenamento para arquivos estáticos e mídia.
3. Origem e licença das imagens das entidades.
4. Observabilidade mínima (logs e erros) no lançamento.

Bloqueantes de negócio: ver `spec.md` §7.
