# ARCH.md --- Arquitetura do Atlas

> **Produto:** Atlas\
> **Tagline:** O mundo tem histórias.\
> **Status:** Arquitetura conceitual consolidada para orientar o MVP.

## 1. Objetivo e princípios

O Atlas é uma plataforma interativa de exploração do mundo e do
conhecimento. Seu ponto de entrada é um globo terrestre 3D, a partir do
qual o usuário explora lugares, territórios, civilizações,
acontecimentos, pessoas, literatura e temas culturais. O conteúdo
conecta presente e passado, com profundidade acadêmica em linguagem
acessível.

Princípios: 1. O globo é a ferramenta protagonista. 2. Regras de domínio
independem de CesiumJS, MapLibre e provedores cartográficos. 3.
Carregamento sob demanda por viewport, zoom, período e camadas. 4.
Informações e geometrias aparecem progressivamente conforme escala e
contexto. 5. Nem toda entidade precisa ter localização física. 6.
Conteúdo deve ter procedência, fontes e referências. 7. MVP primeiro;
recursos avançados evoluem depois. 8. Arquitetura modular, sem
microserviços prematuros.

## 2. Escopo do produto

### 2.1 MVP

-   Globo 3D com satélite, rotação, zoom, navegação e relevo real.
-   Detalhes cartográficos discretos sobre o satélite.
-   Dados geográficos básicos em escala global.
-   Marcadores com seleção, destaque e cartão de prévia.
-   Busca global por lugares e entidades.
-   Navbar minimalista para ativar camadas opcionais.
-   Camada histórica com fronteiras e territórios de períodos
    selecionados.
-   Linha do tempo compacta e expandida, com seleção de período ou ano.
-   Páginas imersivas, interativas e com navegação por seções.
-   Relações entre entidades e sugestões contextuais opcionais.
-   Cadastro básico de conteúdo e associação de fontes.
-   Aprofundamento editorial inicial no Mediterrâneo, Europa e Oriente
    Médio, incluindo o Norte da África; cobertura geográfica básica
    mundial.

### 2.2 Evolução posterior

**Fase 2:** mapa visual completo de conexões, perfil/histórico,
conquistas, mais camadas e comparação temporal avançada.

**Fase 3:** colaboradores externos, submissão/revisão editorial, papéis
avançados (leitor, colaborador, editor e administrador), versionamento e
correções.

A arquitetura deve permitir essas evoluções, sem implementá-las
antecipadamente.

## 3. Stack e responsabilidades

  -----------------------------------------------------------------------
  Camada                  Tecnologia definida     Responsabilidade
  ----------------------- ----------------------- -----------------------
  Web                     Next.js App Router,     Rotas, páginas e
                          React, TypeScript       interface

  UI                      Tailwind CSS,           Estilo e componentes
                          shadcn/ui, Lucide       

  Animação                Motion                  Transições e movimentos

  Globo 3D                CesiumJS                Globo, câmera, terreno,
                                                  imagens, marcadores e
                                                  camadas 3D

  Mapas 2D                MapLibre GL JS          Mapas
                                                  históricos/temáticos 2D

  API                     Python + FastAPI        Regras de negócio,
                                                  busca e consultas

  Banco                   PostgreSQL + PostGIS    Persistência relacional
                                                  e espacial

  Dados geográficos       GeoJSON e tiles         Intercâmbio e
                          vetoriais               distribuição

  Validação               Pydantic e Zod          Contratos
                                                  backend/frontend

  Testes                  Vitest e Playwright     Testes unitários e E2E

  Processamento           Python; GeoPandas e     Importação, validação e
                          Shapely quando          simplificação
                          necessário              
  -----------------------------------------------------------------------

Rasterio, GDAL, PyProj e GeoAlchemy são ferramentas potenciais para
necessidades específicas, não dependências obrigatórias do início. CMS
ainda não definido; um painel administrativo próprio simples pode
atender ao MVP.

### 3.1 Responsabilidades

**Next.js:** interface, navegação, páginas, estado de exploração e
chamadas aos serviços. Não deve conter regras históricas/espaciais
complexas.

**Adaptador cartográfico do Atlas:** camada interna que traduz o modelo
geográfico do Atlas para Cesium ou MapLibre. Controla marcadores,
seleção, destaque, visibilidade por zoom, camadas, períodos e eventos.
Evita acoplar o domínio aos motores.

**CesiumJS:** motor protagonista do globo 3D, imagens de satélite,
terreno, atmosfera, câmera e renderização de dados geográficos.

**MapLibre GL JS:** mapas 2D temáticos/históricos ou visualizações
planas específicas. Não renderizar o mesmo mapa simultaneamente nos dois
motores.

**FastAPI:** APIs, regras de domínio, validações, busca e coordenação
das consultas. Não precisa servir individualmente cada tile.

**PostgreSQL + PostGIS:** fonte persistente de entidades, relações,
fontes, períodos, camadas e geometrias; executa consultas espaciais.

**Pipeline geográfico:** importa bases abertas e fontes históricas,
valida e normaliza geometrias, associa períodos/camadas, simplifica e
gera tiles.

**Tiles/CDN:** distribuição otimizada de dados geográficos
pré-processados. PostGIS continua sendo a fonte de dados; serviço e
formato finais serão escolhidos após avaliação de custo e volume.

## 4. Fluxogramas da arquitetura

### 4.1 Visão geral

``` mermaid
flowchart TD
    U[Usuário] --> WEB[Next.js]
    WEB --> HOME[Home / globo]
    WEB --> PAGES[Páginas imersivas]
    WEB --> SEARCH[Busca global]
    WEB --> NAV[Navbar e camadas]
    HOME --> ADAPTER[Adaptador cartográfico Atlas]
    NAV --> STATE[Estado de exploração]
    STATE --> ADAPTER
    SEARCH --> API[FastAPI]
    PAGES --> API
    ADAPTER --> CESIUM[CesiumJS - globo 3D]
    ADAPTER --> MAPLIBRE[MapLibre - mapas 2D]
    CESIUM --> TILES[Serviço de tiles / CDN]
    MAPLIBRE --> TILES
    API --> DOMAIN[Serviços de domínio]
    DOMAIN --> DB[(PostgreSQL + PostGIS)]
    DOMAIN --> CACHE[Cache, quando necessário]
    DB --> ENT[Entidades e relações]
    DB --> GEO[Geometrias e territórios]
    DB --> TIME[Períodos e eventos]
    DB --> SRC[Fontes e referências]
    PIPE[Pipeline geográfico] --> DB
    PIPE --> TILES
    OPEN[Dados geográficos abertos] --> PIPE
    HIST[Fontes históricas/cartográficas] --> PIPE
    EDIT[Conteúdo editorial] --> ADMIN[Admin/CMS a definir]
    ADMIN --> API
```

### 4.2 Exploração do globo

``` mermaid
flowchart TD
    A[Abrir Atlas] --> B[Carregar home e globo]
    B --> C[Satélite, terreno e atmosfera]
    C --> D[Consultar dados básicos da área visível]
    D --> E[Renderizar rótulos e fronteiras por escala]
    E --> F{Ação do usuário}
    F -->|Mover ou girar| G[Atualizar câmera e viewport]
    G --> H[Recalcular LOD e área consultada]
    H --> I[Buscar somente dados necessários]
    I --> E
    F -->|Zoom| H
    F -->|Selecionar marcador| J[Destacar em dourado]
    J --> K[Cartão flutuante inferior]
    K --> L{Explorar página?}
    L -->|Sim| M[Abrir página imersiva]
    L -->|Não| F
    F -->|Ativar camada| N[Atualizar camadas ativas]
    N --> O[Consultar dados da camada/período]
    O --> P[Atualizar globo]
    P --> F
    F -->|Selecionar período| Q[Atualizar contexto temporal]
    Q --> R[Consultar geometrias válidas]
    R --> S[Atualizar territórios, rotas e marcadores]
    S --> F
```

### 4.3 Consulta geográfica sob demanda

``` mermaid
flowchart TD
    A[Cesium ou MapLibre informa viewport] --> B[Adaptador Atlas]
    B --> C[Área + zoom + período + camadas]
    C --> D[API geográfica FastAPI]
    D --> E[Validar parâmetros e limites]
    E --> F[Consultar cache]
    F -->|Hit| G[Retornar dados/tiles]
    F -->|Miss| H[Consultar PostGIS]
    H --> I[Interseção espacial]
    I --> J[Filtro temporal e de camada]
    J --> K[LOD e simplificação]
    K --> L[Resposta geográfica]
    L --> M[Cache, se adequado]
    M --> G
    G --> N[Renderizar no motor]
```

### 4.4 Ingestão de dados

``` mermaid
flowchart TD
    A[Base aberta ou fonte histórica] --> B[Ingestão]
    B --> C[Registrar origem, licença e metadados]
    C --> D[Validar formato, CRS e geometria]
    D --> E[Normalizar para o modelo Atlas]
    E --> F[Associar entidade, camada e período]
    F --> G[(PostGIS)]
    G --> H[Preparar distribuição]
    H --> I[Gerar simplificações por LOD]
    I --> J[Gerar tiles vetoriais]
    J --> K[Publicar em serviço/CDN]
```

### 4.5 Busca e conteúdo editorial

``` mermaid
flowchart TD
    A[Consulta do usuário] --> B[Frontend envia termo/filtros]
    B --> C[FastAPI valida e pesquisa]
    C --> D[Entidades, aliases e tipos]
    D --> E[Ordenar por relevância/contexto]
    E --> F[Retornar resultados]
    F --> G{Tem localização?}
    G -->|Sim| H[Posicionar globo]
    G -->|Não| I[Abrir página sem coordenadas]
    H --> J[Prévia e página]
    I --> J
    J --> K[Renderizar seções, relações e fontes]
```

Fluxo editorial: 1. Editor/admin cria ou seleciona uma entidade. 2.
Preenche introdução e seções específicas do tipo. 3. Associa entidades
relacionadas. 4. Associa períodos e geometrias quando aplicável. 5.
Associa fontes já cadastradas na Biblioteca Central. 6. Valida
procedência e publica. 7. API entrega o conteúdo à página imersiva.

## 5. Organização de módulos

### 5.1 Frontend --- estrutura lógica sugerida

``` text
apps/web/
  app/
    (exploration)/page.tsx
    entity/[slug]/page.tsx
    search/page.tsx
  components/
    globe/
      GlobeViewport
      GlobeControls
      GlobeMarker
      MarkerPreview
      GlobeTimeline
      LayerPanel
    entity/
      EntityHeader
      SectionNavigation
      EntityRelations
      SourceList
    maps/
      HistoricalMap
      MapLegend
  features/
    exploration/
    search/
    timeline/
    layers/
    entities/
  domain/
    entities/
    geography/
    chronology/
    sources/
    relations/
  adapters/
    cesium/
    maplibre/
  lib/
    api/
    validation/
```

Regras: - Componentes não executam SQL nem conhecem PostGIS. - Domínio
não depende diretamente de CesiumJS. - Adaptadores traduzem dados do
Atlas para os motores. - Cesium/MapLibre são carregados em componentes
client-side do Next.js. - Carregar módulos cartográficos e visualizações
pesadas sob demanda. - Estado de exploração explícito: viewport,
zoom/LOD, período, camadas e entidade selecionada.

### 5.2 Backend --- estrutura lógica sugerida

``` text
backend/app/
  main.py
  api/routes/
    entities.py
    search.py
    geography.py
    chronology.py
    layers.py
    sources.py
    relations.py
  domain/
    entities/
    geography/
    chronology/
    sources/
    relations/
  services/
  repositories/
  schemas/
  infrastructure/
    database/
    cache/
    tile_provider/
  tests/
```

Rotas conceituais (não congeladas): - `/entities`: entidades, detalhes e
seções. - `/search`: busca global. - `/geography`: consultas por
viewport, camada e LOD. - `/chronology`: períodos, eventos e geometrias
temporais. - `/layers`: metadados das camadas. - `/sources`: fontes e
associações. - `/relations`: relações entre entidades.

FastAPI coordena regras de domínio; repositórios concentram acesso ao
banco. Pydantic valida entradas/saídas. Implementar limites de resposta,
paginação, timeout e cache conforme necessidade.

## 6. Estratégia cartográfica

### 6.1 CesiumJS

Motor principal para globo, câmera, imagens de satélite, terreno real,
atmosfera, marcadores, fronteiras atuais/históricas, rotas e camadas 3D.

### 6.2 MapLibre GL JS

Motor complementar para mapas 2D históricos/temáticos e visualizações
planas específicas. Compartilha coordenadas e dados do Atlas, mas não a
implementação de renderização.

### 6.3 Provedor de satélite e terreno

Cesium ion é candidato inicial, não decisão final. Avaliar limites
gratuitos, licença, atribuição, tráfego, custos, qualidade e cobertura.
Encapsular o provedor por adaptador para permitir substituição.

### 6.4 Carregamento por viewport e LOD

-   Globo distante: dados globais simplificados.
-   Aproximação: restringir consultas à área visível e aumentar detalhe.
-   Afastamento: ampliar área e reduzir complexidade.
-   Usar cache, simplificação e tiles.
-   Não carregar todas as geometrias e marcadores do mundo de uma vez.
-   PostGIS é a fonte de dados; tiles vetoriais pré-processados são a
    estratégia de distribuição.

### 6.5 Visibilidade progressiva

  Escala               Informações predominantes
  -------------------- --------------------------------------------
  Globo inteiro        Grade de latitude/longitude muito sutil
  Continente           Nomes dos continentes
  País/região          Fronteiras e nomes de países
  Região subnacional   Estados/províncias e cidades
  Cidade               Bairros, monumentos e pontos de interesse
  Local selecionado    Marcador dourado e informações específicas

Os limites exatos de zoom serão calibrados com testes de legibilidade e
desempenho.

## 7. Interação, camadas e tempo

### 7.1 Marcadores

Três níveis editoriais: 1. Principais: capitais, monumentos, sítios
arqueológicos e lugares históricos relevantes. 2. Secundários: locais
culturais, naturais e históricos menos conhecidos. 3. Especiais:
batalhas, acontecimentos, rotas, migrações e eventos geográficos.

A classificação pertence ao modelo de dados do Atlas. A visibilidade
depende de zoom, relevância, contexto e camadas ativas.

**Interação aprovada:** primeiro clique seleciona e destaca em dourado;
cartão flutuante inferior exibe nome, imagem e descrição curta, mantendo
o globo visível; ação "Explorar" abre a página completa.

### 7.2 Camadas

Navbar flutuante minimalista, escura/translúcida, detalhes dourados;
recolhida mostra ícones sem textos; expandida apresenta painel
contextual pequeno; fecha ao clicar fora. Camadas opcionais e
combináveis: - História - Geografia - Literatura - Cultura -
Personalidades - Acontecimentos

Separar **mapa de fundo** (satélite, topográfico etc.) de **camadas de
conhecimento** (fronteiras históricas, rotas, eventos, literatura,
cultura). Exemplo: satélite como fundo e fronteiras do Império Romano
sobrepostas.

### 7.3 Linha do tempo

-   Modo compacto: linha horizontal discreta, períodos, datas e marcos;
    navegação por arraste e avanço/retrocesso.
-   Modo expandido: eventos, ascensão/queda de impérios, guerras,
    transformações territoriais, migrações, rotas, civilizações e
    personagens.
-   Seleção de período ou ano específico atualiza geometrias e
    marcadores.
-   Periodizações devem respeitar contextos regionais/culturais;
    cronologias europeias não são universais.
-   Registrar início/fim, fontes e grau de precisão.

### 7.4 Busca e descoberta

Busca global por lugares, civilizações, personagens, acontecimentos,
monumentos, livros e conceitos. Quando houver localização, posicionar o
globo; entidades sem localização continuam com página própria.
Exploração livre é o padrão; sugestões contextuais opcionais e
discretas. Relações clicáveis abrem diretamente outras páginas.

## 8. Páginas imersivas

Infraestrutura reutilizável: cabeçalho, introdução, navegação por
seções, conteúdo, visualizações, relações, fontes e contexto
geográfico/temporal. Cada tipo tem estrutura própria; não forçar
template idêntico.

Navegação por seções aprovada: menu discreto acompanha rolagem, indica
seção atual, permite saltos diretos, tem transições suaves e versão
responsiva.

Exemplo de Império Romano:
`Visão geral · Território · Expansão · Governantes · Guerras · Sociedade · Legado · Fontes`.

  -----------------------------------------------------------------------
  Tipo                                Visualizações possíveis
  ----------------------------------- -----------------------------------
  País/cidade/região                  Geografia, evolução
                                      territorial/urbana, monumentos,
                                      história e cultura

  Civilização                         Território, cronologia, sociedade,
                                      religião, economia, cultura e
                                      legado

  Estado/império                      Mapa territorial,
                                      expansão/retração, governantes,
                                      conflitos e legado

  Pessoa                              Biografia cronológica, locais,
                                      relações, obras e realizações

  Acontecimento                       Mapa, cronologia, causas,
                                      consequências e personagens

  Cultura/tema                        Religião, idioma, artes, costumes,
                                      literatura e transformações

  Livro/obra                          Autor, contexto, temas, circulação,
                                      influência e relações
  -----------------------------------------------------------------------

Componentes interativos reutilizáveis: timeline, mapa territorial,
comparador de períodos, expansão de impérios, árvore de relações,
visualizador de rotas e galeria de documentos. Desenvolver conforme a
necessidade do MVP.

## 9. Modelo de dados conceitual

### 9.1 Estratégia

Modelo centrado em **entidades**. Cada entidade pode ter página,
aliases, seções, relações, fontes e, quando aplicável, geometrias e
períodos. Geografia e cronologia são dimensões relacionadas, não
requisitos para todo conteúdo: livros, conceitos e obras podem não ter
coordenadas.

### 9.2 Diagrama ER

``` mermaid
erDiagram
    ENTITY ||--o{ ENTITY_ALIAS : possui
    ENTITY ||--o{ ENTITY_SECTION : contem
    ENTITY ||--o{ ENTITY_RELATION : origem
    ENTITY ||--o{ ENTITY_RELATION : destino
    ENTITY ||--o{ ENTITY_GEOMETRY : localizacao
    ENTITY ||--o{ ENTITY_PERIOD : participa
    ENTITY ||--o{ ENTITY_SOURCE : fundamentada
    SOURCE ||--o{ ENTITY_SOURCE : citada
    HISTORICAL_PERIOD ||--o{ ENTITY_PERIOD : contextualiza
    HISTORICAL_PERIOD ||--o{ GEO_FEATURE : validade
    LAYER ||--o{ GEO_FEATURE : organiza
    ENTITY ||--o{ GEO_FEATURE : representa
    GEO_FEATURE ||--o{ GEO_FEATURE_SOURCE : documentada
    SOURCE ||--o{ GEO_FEATURE_SOURCE : sustenta
    HISTORICAL_PERIOD ||--o{ HISTORICAL_PERIOD : hierarquia

    ENTITY {
      uuid id PK
      string slug UK
      string name
      string entity_type
      string summary
      string status
    }
    ENTITY_ALIAS {
      uuid id PK
      uuid entity_id FK
      string alias
      string language_code
      string alias_type
    }
    ENTITY_SECTION {
      uuid id PK
      uuid entity_id FK
      string section_key
      string title
      int position
      jsonb content
    }
    ENTITY_RELATION {
      uuid id PK
      uuid source_entity_id FK
      uuid target_entity_id FK
      string relation_type
      string description
    }
    HISTORICAL_PERIOD {
      uuid id PK
      uuid parent_period_id FK
      string name
      date start_date
      date end_date
      string date_precision
      string region_context
    }
    ENTITY_PERIOD {
      uuid id PK
      uuid entity_id FK
      uuid period_id FK
      string role
      string precision
    }
    LAYER {
      uuid id PK
      string key UK
      string name
      string layer_type
    }
    ENTITY_GEOMETRY {
      uuid id PK
      uuid entity_id FK
      geometry geometry
      string geometry_type
    }
    GEO_FEATURE {
      uuid id PK
      uuid entity_id FK
      uuid layer_id FK
      uuid period_id FK
      geometry geometry
      string feature_type
      int importance_level
    }
    SOURCE {
      uuid id PK
      string title
      string source_type
      string author_or_institution
      string identifier
      string url
    }
    ENTITY_SOURCE {
      uuid id PK
      uuid entity_id FK
      uuid source_id FK
      string contribution_type
      string locator
    }
    GEO_FEATURE_SOURCE {
      uuid id PK
      uuid geo_feature_id FK
      uuid source_id FK
      string contribution_type
      string locator
    }
```

### 9.3 Entidades centrais

**ENTITY:** qualquer objeto de conhecimento com identidade própria e
potencial página dedicada.

Tipos iniciais: - `place`: país, cidade, região ou território; -
`civilization`: civilização; - `state`: estado, reino ou império; -
`person`: pessoa/personagem; - `event`: acontecimento; - `culture`: tema
ou manifestação cultural; - `work`: livro ou obra; - `concept`: conceito
ou tema não necessariamente geográfico.

**ENTITY_ALIAS:** nomes históricos, variantes linguísticas,
transliterações, exônimos e nomes anteriores. Apoia busca e
contextualização.

**ENTITY_SECTION:** seções específicas da página. Ordem e estrutura
configuráveis. `content` pode ser JSONB no MVP, validado por esquemas de
blocos; estruturas que crescerem podem migrar para tabelas específicas.

**ENTITY_RELATION:** relações direcionadas ou simétricas. Exemplos:
pessoa participou de evento; cidade foi capital de império; obra foi
escrita por pessoa; civilização influenciou outra. Deve registrar tipo,
contexto e, quando necessário, validade temporal e fonte.

**HISTORICAL_PERIOD:** períodos hierárquicos e recortes cronológicos
contextualizados regionalmente. Datas aproximadas devem registrar
precisão.

**ENTITY_PERIOD:** associação entre entidade e período, indicando o
papel da entidade naquele contexto.

**ENTITY_GEOMETRY:** geometria de referência associada à entidade. Uma
entidade pode ter mais de uma geometria.

**GEO_FEATURE:** elemento cartográfico exibido no globo/mapa: fronteira,
território, rota, área de influência, batalha, local ou região cultural.
Pode associar entidade, camada e período.

**LAYER:** metadado das camadas ativáveis: História, Geografia,
Literatura, Cultura, Personalidades e Acontecimentos.

**SOURCE:** Biblioteca Central de Fontes e Referências. A fonte é
cadastrada uma vez e associada a várias entidades/elementos.

Tipos iniciais de fonte: livro/obra acadêmica, artigo científico,
documento/fonte primária, mapa/documento cartográfico, arquivo
histórico, base aberta e reportagem/publicação jornalística.

**ENTITY_SOURCE / GEO_FEATURE_SOURCE:** associações muitos-para-muitos
que registram papel da fonte, página/capítulo/folha/URL e observações.

## 10. Dicionário de dados

Tipos sugeridos para PostgreSQL; `geometry` pressupõe PostGIS. Tabelas
mutáveis devem ter `created_at` e `updated_at`; campos de autoria podem
ser acrescentados quando houver usuários administrativos.

### 10.1 `entities`

  Campo           Tipo             Obrigatório Descrição
  --------------- -------------- ------------- ----------------------------------
  `id`            UUID                     Sim Chave primária
  `slug`          VARCHAR(180)             Sim Identificador único para URL
  `name`          VARCHAR(240)             Sim Nome principal
  `entity_type`   VARCHAR(40)              Sim Tipo controlado da entidade
  `summary`       TEXT                     Não Resumo para prévias e busca
  `description`   TEXT                     Não Introdução geral opcional
  `status`        VARCHAR(24)              Sim `draft`, `published`, `archived`
  `cover_media`   TEXT                     Não Referência de mídia de capa
  `created_at`    TIMESTAMPTZ              Sim Criação
  `updated_at`    TIMESTAMPTZ              Sim Atualização

### 10.2 `entity_aliases`

  --------------------------------------------------------------------------
  Campo             Tipo                       Obrigatório Descrição
  ----------------- ---------------- --------------------- -----------------
  `id`              UUID                               Sim Chave primária

  `entity_id`       UUID FK                            Sim Entidade

  `alias`           VARCHAR(240)                       Sim Nome alternativo

  `language_code`   VARCHAR(12)                        Não Idioma/variante
                                                           (BCP 47)

  `alias_type`      VARCHAR(32)                        Não Histórico,
                                                           transliteração,
                                                           exônimo etc.

  `valid_from`      DATE                               Não Início de
                                                           validade do nome

  `valid_to`        DATE                               Não Fim de validade
                                                           do nome
  --------------------------------------------------------------------------

### 10.3 `entity_sections`

  Campo           Tipo             Obrigatório Descrição
  --------------- -------------- ------------- --------------------------------
  `id`            UUID                     Sim Chave primária
  `entity_id`     UUID FK                  Sim Página proprietária
  `section_key`   VARCHAR(80)              Sim Chave estável para navegação
  `title`         VARCHAR(180)             Sim Título visível
  `position`      INTEGER                  Sim Ordem na página
  `content`       JSONB                    Sim Blocos de conteúdo estruturado
  `created_at`    TIMESTAMPTZ              Sim Criação
  `updated_at`    TIMESTAMPTZ              Sim Atualização

Unicidade recomendada: `(entity_id, section_key)` e
`(entity_id, position)`.

### 10.4 `entity_relations`

  Campo                Tipo            Obrigatório Descrição
  -------------------- ------------- ------------- ----------------------------
  `id`                 UUID                    Sim Chave primária
  `source_entity_id`   UUID FK                 Sim Entidade de origem
  `target_entity_id`   UUID FK                 Sim Entidade de destino
  `relation_type`      VARCHAR(60)             Sim Tipo controlado da relação
  `description`        TEXT                    Não Explica a relação
  `is_directional`     BOOLEAN                 Sim Se a relação tem direção
  `valid_from`         DATE                    Não Início da relação
  `valid_to`           DATE                    Não Fim da relação
  `position`           INTEGER                 Não Ordem editorial

### 10.5 `historical_periods`

  -------------------------------------------------------------------------------
  Campo                Tipo                       Obrigatório Descrição
  -------------------- ---------------- --------------------- -------------------
  `id`                 UUID                               Sim Chave primária

  `parent_period_id`   UUID FK                            Não Período superior

  `name`               VARCHAR(180)                       Sim Nome do período

  `start_date`         DATE                               Não Início normalizado,
                                                              se possível

  `end_date`           DATE                               Não Fim normalizado, se
                                                              possível

  `start_label`        VARCHAR(80)                        Não Rótulo histórico
                                                              exibido

  `end_label`          VARCHAR(80)                        Não Rótulo histórico
                                                              exibido

  `date_precision`     VARCHAR(32)                        Sim `exact`,
                                                              `approximate`,
                                                              `century`, `range`,
                                                              `unknown`

  `region_context`     VARCHAR(180)                       Não Contexto
                                                              regional/cultural

  `description`        TEXT                               Não Explicação do
                                                              período
  -------------------------------------------------------------------------------

**Atenção cronológica:** datas a.C. precisam de convenção interna
consistente para ordenação e consultas. Não misturar datas civis com
anos negativos sem uma regra documentada.

### 10.6 `entity_periods`

  Campo         Tipo            Obrigatório Descrição
  ------------- ------------- ------------- ---------------------------------------
  `id`          UUID                    Sim Chave primária
  `entity_id`   UUID FK                 Sim Entidade
  `period_id`   UUID FK                 Sim Período
  `role`        VARCHAR(48)             Não Papel: ativo_durante, fundado_em etc.
  `precision`   VARCHAR(32)             Não Precisão desta associação
  `notes`       TEXT                    Não Contexto adicional

### 10.7 `layers`

  ---------------------------------------------------------------------------
  Campo               Tipo                       Obrigatório Descrição
  ------------------- ---------------- --------------------- ----------------
  `id`                UUID                               Sim Chave primária

  `key`               VARCHAR(60)                        Sim Chave única e
                                                             estável

  `name`              VARCHAR(120)                       Sim Nome visível

  `layer_type`        VARCHAR(40)                        Sim Categoria da
                                                             camada

  `description`       TEXT                               Não Explicação

  `default_enabled`   BOOLEAN                            Sim Se inicia ativa;
                                                             camadas de
                                                             conhecimento são
                                                             opcionais por
                                                             padrão

  `min_zoom`          NUMERIC                            Não Escala mínima

  `max_zoom`          NUMERIC                            Não Escala máxima
  ---------------------------------------------------------------------------

### 10.8 `entity_geometries`

  -------------------------------------------------------------------------
  Campo             Tipo                       Obrigatório Descrição
  ----------------- ---------------- --------------------- ----------------
  `id`              UUID                               Sim Chave primária

  `entity_id`       UUID FK                            Sim Entidade

  `geometry`        geometry                           Sim Geometria
                                                           PostGIS

  `geometry_type`   VARCHAR(32)                        Sim Ponto, linha,
                                                           polígono ou
                                                           coleção

  `label`           VARCHAR(180)                       Não Identificação da
                                                           geometria

  `source_name`     VARCHAR(180)                       Não Origem técnica

  `valid_from`      DATE                               Não Início de
                                                           validade

  `valid_to`        DATE                               Não Fim de validade

  `properties`      JSONB                              Não Metadados
                                                           complementares
  -------------------------------------------------------------------------

### 10.9 `geo_features`

  ----------------------------------------------------------------------------
  Campo                Tipo                       Obrigatório Descrição
  -------------------- ---------------- --------------------- ----------------
  `id`                 UUID                               Sim Chave primária

  `entity_id`          UUID FK                            Não Entidade
                                                              representada

  `layer_id`           UUID FK                            Sim Camada temática

  `period_id`          UUID FK                            Não Período
                                                              associado

  `feature_type`       VARCHAR(48)                        Sim Fronteira,
                                                              território,
                                                              rota, batalha
                                                              etc.

  `name`               VARCHAR(240)                       Não Nome
                                                              cartográfico

  `geometry`           geometry                           Sim Geometria
                                                              PostGIS

  `importance_level`   SMALLINT                           Sim 1 principal, 2
                                                              secundário, 3
                                                              especial

  `min_zoom`           NUMERIC                            Não Zoom mínimo

  `max_zoom`           NUMERIC                            Não Zoom máximo

  `valid_from`         DATE                               Não Início de
                                                              validade

  `valid_to`           DATE                               Não Fim de validade

  `properties`         JSONB                              Não Atributos
                                                              específicos

  `source_dataset`     VARCHAR(180)                       Não Dataset de
                                                              origem
  ----------------------------------------------------------------------------

### 10.10 `sources`

  ------------------------------------------------------------------------------------
  Campo                     Tipo                       Obrigatório Descrição
  ------------------------- ---------------- --------------------- -------------------
  `id`                      UUID                               Sim Chave primária

  `title`                   VARCHAR(500)                       Sim Título da fonte

  `source_type`             VARCHAR(48)                        Sim Livro, artigo,
                                                                   fonte primária,
                                                                   mapa, arquivo,
                                                                   base, reportagem
                                                                   etc.

  `author_or_institution`   VARCHAR(300)                       Não Autor/instituição

  `publication_date`        DATE                               Não Data de publicação

  `publisher_or_journal`    VARCHAR(240)                       Não Editora/periódico

  `identifier`              VARCHAR(180)                       Não ISBN, DOI ou
                                                                   identificador

  `url`                     TEXT                               Não Endereço eletrônico

  `language_code`           VARCHAR(12)                        Não Idioma

  `source_nature`           VARCHAR(32)                        Não Primária,
                                                                   secundária, base,
                                                                   jornalística etc.

  `reliability_note`        TEXT                               Não Confiabilidade,
                                                                   limitações e uso

  `license`                 VARCHAR(180)                       Não Licença/termos de
                                                                   uso

  `created_at`              TIMESTAMPTZ                        Sim Cadastro

  `updated_at`              TIMESTAMPTZ                        Sim Atualização
  ------------------------------------------------------------------------------------

### 10.11 `entity_sources`

  ------------------------------------------------------------------------------
  Campo                 Tipo                       Obrigatório Descrição
  --------------------- ---------------- --------------------- -----------------
  `id`                  UUID                               Sim Chave primária

  `entity_id`           UUID FK                            Sim Entidade
                                                               sustentada

  `source_id`           UUID FK                            Sim Fonte cadastrada

  `contribution_type`   VARCHAR(48)                        Sim Fundamenta,
                                                               contextualiza,
                                                               fonte_primaria,
                                                               imagem, mapa etc.

  `locator`             VARCHAR(500)                       Não Página, capítulo,
                                                               seção ou URL
                                                               específica

  `notes`               TEXT                               Não Como a fonte foi
                                                               utilizada
  ------------------------------------------------------------------------------

### 10.12 `geo_feature_sources`

  -----------------------------------------------------------------------------
  Campo                 Tipo                       Obrigatório Descrição
  --------------------- ---------------- --------------------- ----------------
  `id`                  UUID                               Sim Chave primária

  `geo_feature_id`      UUID FK                            Sim Elemento
                                                               geográfico

  `source_id`           UUID FK                            Sim Fonte

  `contribution_type`   VARCHAR(48)                        Sim Geometria,
                                                               datação,
                                                               interpretação
                                                               etc.

  `locator`             VARCHAR(500)                       Não Página, mapa,
                                                               folha ou URL

  `notes`               TEXT                               Não Observações
  -----------------------------------------------------------------------------

### 10.13 Auditoria mínima

Tabelas editoriais mutáveis devem considerar `created_at`, `updated_at`,
`created_by`, `updated_by` e estado de publicação. Histórico completo de
alterações e workflow ficam para fase posterior.

## 11. Classes e responsabilidades de domínio

O diagrama abaixo representa classes conceituais e associações. Não
obriga uma implementação orientada a objetos literal; pode ser traduzido
para modelos ORM, schemas e serviços.

``` mermaid
classDiagram
    class Entity {
      +UUID id
      +string slug
      +string name
      +EntityType type
      +string summary
      +PublicationStatus status
    }
    class Place
    class Civilization
    class State
    class Person
    class Event
    class Culture
    class Work
    class Concept
    Entity <|-- Place
    Entity <|-- Civilization
    Entity <|-- State
    Entity <|-- Person
    Entity <|-- Event
    Entity <|-- Culture
    Entity <|-- Work
    Entity <|-- Concept

    class EntitySection {
      +UUID id
      +string sectionKey
      +string title
      +int position
      +JSON content
    }
    class EntityRelation {
      +UUID id
      +string relationType
      +string description
      +bool directional
    }
    class HistoricalPeriod {
      +UUID id
      +string name
      +date startDate
      +date endDate
      +string datePrecision
      +string regionContext
    }
    class EntityPeriod {
      +UUID id
      +string role
      +string precision
    }
    class GeometryRecord {
      +UUID id
      +Geometry geometry
      +string geometryType
    }
    class GeoFeature {
      +UUID id
      +string featureType
      +Geometry geometry
      +int importanceLevel
    }
    class Layer {
      +UUID id
      +string key
      +string name
    }
    class Source {
      +UUID id
      +string title
      +string sourceType
      +string identifier
      +string url
    }
    class EntitySource {
      +UUID id
      +string contributionType
      +string locator
    }
    Entity "1" --> "*" EntitySection
    Entity "1" --> "*" EntityRelation : origem
    EntityRelation "*" --> "1" Entity : destino
    Entity "1" --> "*" EntityPeriod
    EntityPeriod "*" --> "1" HistoricalPeriod
    HistoricalPeriod "0..1" --> "0..*" HistoricalPeriod : subperiodos
    Entity "1" --> "*" GeometryRecord
    Entity "0..1" --> "*" GeoFeature
    Layer "1" --> "*" GeoFeature
    HistoricalPeriod "0..1" --> "*" GeoFeature
    Entity "1" --> "*" EntitySource
    EntitySource "*" --> "1" Source
    GeoFeature "*" --> "*" Source : procedencia
```

### 11.1 Serviços de domínio

-   `EntityService`: consulta e montagem de páginas.
-   `RelationService`: relações e navegação contextual.
-   `SearchService`: busca global por nome, alias e tipo.
-   `GeographyService`: consulta espacial por viewport, LOD, camada e
    período.
-   `ChronologyService`: períodos, datas e validade temporal.
-   `SourceService`: biblioteca de fontes e associações.
-   `LayerService`: metadados e disponibilidade de camadas.

### 11.2 Adaptadores cartográficos

-   `GlobeAdapter`: contrato do Atlas para o globo.
-   `CesiumAdapter`: implementação do contrato com CesiumJS.
-   `MapLibreAdapter`: implementação para mapas 2D.
-   Adaptadores recebem dados do domínio e os convertem em entidades
    gráficas, fontes, camadas e eventos do motor.

## 12. Regras de integridade e índices

Índices recomendados: - `entities.slug` único; `entity_type` indexado. -
Alias indexado para busca textual, com normalização
linguística/acentos. - `entity_sections(entity_id, position)`. - Índices
nas duas FKs de `entity_relations`. -
`historical_periods(parent_period_id)`. - GiST em
`geo_features.geometry` e `entity_geometries.geometry`. -
`geo_features(layer_id, period_id)`. - Índices nas FKs das tabelas de
associação de fontes.

Integridade: - FKs em todas as associações. - Slugs únicos. - Tipos de
entidade, relação, camada e fonte controlados. - SRID definido e
geometrias validadas. - Datas coerentes quando início e fim existirem. -
Relações sem referências órfãs. - Conteúdo publicado passa por validação
editorial mínima. - Geometrias e interpretações históricas preservam
procedência.

## 13. Contratos conceituais de API

Exemplos ilustrativos, não contratos congelados.

### 13.1 Consulta geográfica

``` json
{
  "bounds": {
    "west": -10.0,
    "south": 30.0,
    "east": 40.0,
    "north": 60.0
  },
  "zoom": 4,
  "period_id": "uuid-opcional",
  "layers": ["history", "geography"],
  "detail_level": "regional"
}
```

Validar limites, período e camadas; consultar somente dados relevantes.
Em produção, tiles vetoriais podem atender diretamente parte da
distribuição.

### 13.2 Resultado de busca

``` json
{
  "items": [
    {
      "id": "uuid",
      "slug": "imperio-romano",
      "name": "Império Romano",
      "entity_type": "state",
      "summary": "Resumo...",
      "location": {
        "type": "centroid",
        "coordinates": [12.4964, 41.9028]
      }
    }
  ]
}
```

Resultados sem localização são válidos; a interface abre a página sem
posicionar o globo.

### 13.3 Entidade

``` json
{
  "id": "uuid",
  "slug": "imperio-romano",
  "name": "Império Romano",
  "entity_type": "state",
  "summary": "Resumo...",
  "sections": [
    {
      "section_key": "overview",
      "title": "Visão geral",
      "position": 1,
      "content": []
    }
  ],
  "relations": [],
  "sources": []
}
```

## 14. Desempenho, custos e segurança

-   Carregar globo, páginas e módulos pesados sob demanda.
-   Consultar somente a área visível.
-   Aplicar LOD, simplificação, tiles e cache.
-   Não enviar todas as geometrias históricas ao cliente.
-   Não duplicar renderização nos dois motores.
-   Medir tamanho dos tiles, latência, tráfego e memória antes de
    ampliar infraestrutura.
-   Não adotar microserviços no MVP sem necessidade comprovada.
-   Validar entradas com Pydantic e Zod.
-   Restringir escrita a rotas administrativas.
-   Configurar CORS, limites de requisição e proteção contra abuso.
-   Guardar segredos fora do frontend.
-   Validar uploads e URLs caso o admin permita mídia.
-   Autenticação, papéis e auditoria avançada podem entrar nas fases
    posteriores.

## 15. Testes

  -----------------------------------------------------------------------
  Camada                              Testes
  ----------------------------------- -----------------------------------
  Domínio                             Entidades, relações, cronologia e
                                      procedência

  API                                 Contratos, filtros, paginação e
                                      erros

  PostGIS                             Interseção espacial, geometrias e
                                      filtros temporais

  Frontend                            Componentes, camadas, busca e
                                      navegação

  Cartografia                         Marcadores, LOD, períodos e camadas

  E2E                                 Abrir globo, explorar, selecionar,
                                      abrir página e navegar seções

  Performance                         Carga inicial, viewport, tiles e
                                      memória
  -----------------------------------------------------------------------

Vitest e Playwright foram definidos como base de testes.

## 16. Decisões fechadas e pontos em aberto

### Consolidadas

-   Next.js, React e TypeScript.
-   CesiumJS como globo 3D protagonista.
-   MapLibre GL JS como motor complementar 2D.
-   FastAPI.
-   PostgreSQL + PostGIS.
-   PostGIS como fonte de dados e tiles vetoriais pré-processados para
    distribuição.
-   Carregamento por viewport e LOD.
-   Camadas opcionais e combináveis, separadas do mapa de fundo.
-   Linha do tempo híbrida com período e ano específico.
-   História no globo 3D.
-   Prévia inferior de marcador antes da página.
-   Entidades tipadas, páginas próprias e relações.
-   Biblioteca Central de Fontes e Referências.
-   Páginas interativas e navegação por seções.
-   Navegação livre com sugestões contextuais opcionais.
-   MVP global, com aprofundamento inicial no Mediterrâneo, Europa e
    Oriente Médio.
-   Evolução gradual.

### Em aberto

-   Provedor definitivo de imagens e terreno (Cesium ion é candidato).
-   Serviço/CDN e formato final de tiles.
-   CMS ou admin próprio para MVP.
-   Estratégia definitiva de busca e indexação.
-   Autenticação e gestão de usuários.
-   SQL final, migrations, enums e convenção cronológica a.C./d.C.
-   Licenças, atribuição e atualização das bases.
-   Limites exatos de zoom/LOD e cache.

## 17. Versionamento e lançamentos

### 17.1 Três versões independentes

  -----------------------------------------------------------------------
  Versão                  Exemplo                 Significado
  ----------------------- ----------------------- -----------------------
  Contrato da API         `/v1`                   Contrato consumido pelos
                                                  clientes. Só muda com
                                                  quebra incompatível que
                                                  exija manter duas
                                                  versões no ar.

  Repositório             `v0.2.0`                Semver de cada
                                                  repositório (`oAtlas`,
                                                  `ortelius`), versionado
                                                  de forma independente.

  Produto                 Atlas Beta              Nome público do
                                                  lançamento. Decisão de
                                                  negócio.
  -----------------------------------------------------------------------

Os repositórios não sincronizam números de versão. O elo entre eles é o
contrato OpenAPI; a compatibilidade é registrada nas notas de versão
(ex.: "requer `ortelius` ≥ `v0.3.0`").

### 17.2 Semver durante o MVP

O MVP é lançado como `0.x` (Atlas Beta). Em `0.x`, mudanças
incompatíveis são permitidas no MINOR, o que acomoda o aprendizado da
validação da hipótese sem prometer estabilidade.

-   **`0.MINOR.0`:** fim de uma fase do plano do MVP; entrega
    demonstrável.
-   **`0.x.PATCH`:** correção sobre uma versão já marcada, sem
    funcionalidade nova.
-   **`1.0.0`:** quando os sinais de sucesso da spec confirmarem a
    hipótese e o contrato estiver estável. Decisão de negócio.

Um repositório só recebe nova versão nas fases em que muda.

### 17.3 Fluxo

``` text
issue → branch → PR → merge na main          (para cada issue da fase)
                            ↓
          fase concluída: tag vX.Y.0 na main + notas de versão
                            ↓
          correção posterior: issue → PR → merge → tag vX.Y.1
```

-   Issue não gera tag. Tags marcam versões entregues, que agrupam
    várias issues.
-   Tags são criadas na `main`, nunca em branches de funcionalidade.
-   Notas de versão derivam das mensagens de commit (`feat`, `fix`,
    `chore`, `docs`).
-   Correção urgente com a `main` já à frente da versão em produção:
    branch a partir da tag, correção, tag PATCH e retorno da correção
    para a `main`.
-   Deploy sempre a partir de uma tag, o que garante rastreabilidade e
    rollback.

## 18. Ordem sugerida de implementação

1.  Definir estrutura simples de projetos frontend/backend.
2.  Configurar Next.js, TypeScript e design system mínimo.
3.  Fazer prova de conceito Cesium com globo, satélite e terreno.
4.  Validar provedor, créditos, licenças, limites e custos.
5.  Implementar adaptador cartográfico e estado de exploração.
6.  Configurar PostgreSQL + PostGIS e migrations iniciais.
7.  Criar entidades, aliases, relações, períodos, fontes e geometrias
    mínimas.
8.  Criar FastAPI e APIs de entidades, busca e geografia.
9.  Implementar pipeline geográfico global básico.
10. Implementar viewport, LOD e tiles/cache.
11. Implementar marcadores, prévia e camadas.
12. Implementar linha do tempo e primeiras geometrias históricas.
13. Implementar páginas imersivas e navegação por seções.
14. Cadastrar conteúdo e fontes das regiões prioritárias.
15. Testar desempenho, procedência e experiência em dispositivos
    modestos.
16. Evoluir para conexões, conquistas e colaboradores após validar o
    núcleo.

## 19. Princípio norteador

> **O Atlas não entrega um caminho pronto: oferece um mundo para
> explorar e histórias para descobrir.**

O globo convida à exploração, as páginas aprofundam o conhecimento e as
relações revelam conexões. A tecnologia deve servir a essa experiência,
com rigor de dados, desempenho e evolução gradual.
