# Capa da entidade — Plano técnico

> **Status:** rascunho para aprovação
> **Spec:** `spec.md` nesta pasta. Responde às questões em aberto 2 e 3 do plano do MVP (§9) no que
> diz respeito às capas.

## 1. Decisões

### 1.1 Procedência mora no domínio: tabela `media`

Uma tabela de domínio `media` (schema `public`, dona do `ortelius`) descreve cada imagem usada pelo
Atlas:

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | uuid | PK |
| `file_id` | text | id do arquivo no Directus (`directus_files`); sem FK, como hoje (plano do MVP §3.4) |
| `alt_text` | varchar(300) | obrigatório: descreve a imagem para quem não a vê |
| `caption` | varchar(300) | obrigatório: o que é a imagem ("Mosaico de Virgílio entre Clio e Melpômene") |
| `author` | varchar(200) | obrigatório (para domínio público, o autor original ou "desconhecido") |
| `license` | varchar(24) | obrigatório, CHECK na lista fechada: `public_domain`, `cc0`, `cc_by`, `cc_by_sa` |
| `license_version` | varchar(8) | opcional ("4.0"), compõe o link da licença |
| `source_url` | text | obrigatório, CHECK `^https?://` |
| `created_at`, `updated_at` | timestamptz | como as demais tabelas |

`entities.cover_id` (uuid, FK para `media.id`, `ON DELETE SET NULL`) substitui `entities.cover_media`.

- **Por que não campos extras em `directus_files`:** seriam colunas no schema do Directus, fora das
  migrations do domínio, e o banco não garantiria o preenchimento. Com `NOT NULL` e CHECK em `media`,
  uma capa sem crédito não consegue existir, nem pelo painel, nem pelo pipeline, nem por SQL. O
  bloqueio de publicação da spec vem de graça, sem trigger novo.
- **Reaproveitamento:** a mesma linha de `media` pode ser capa de várias entidades.
- **Rótulos e links das licenças** ficam no `ortelius` (um dicionário `license → nome, URL`), não no banco.

### 1.2 A imagem é servida pelo `ortelius`

`GET /v1/media/{media_id}/{width}.webp`:

- **Só capas publicadas:** responde 404 se a mídia não for capa de ao menos uma entidade `published`.
  Rascunhos e arquivos soltos do Directus nunca vazam.
- **Larguras fixas:** 480, 960 e 1600. Qualquer outra responde 404, o que impede que alguém force o
  servidor a gerar tamanhos arbitrários.
- **Geração:**
  - Pillow (dependência nova) lê o original, corrige a orientação EXIF e reduz sem ampliar;
  - grava WebP de qualidade 80 sem metadados;
  - aceita só `image/jpeg`, `image/png` e `image/webp`, e limita os pixels contra imagem-bomba
    (`Image.MAX_IMAGE_PIXELS`).
- **Cache em disco:** o derivado fica em `MEDIA_CACHE_DIR/<file_id>/<versão>/<width>.webp`. A versão
  vem de `directus_files.modified_on`: trocar o arquivo no painel muda a URL.
- **Cabeçalhos:** a URL carrega a versão (`?v=`), então a resposta é `Cache-Control: public,
  max-age=31536000, immutable`.
- **Origem dos bytes:** uma interface `MediaStorage` com uma implementação local (diretório dos uploads
  do Directus). A implementação S3 entra quando a hospedagem for decidida (fase 8), sem mudar a API.
- **Acesso ao Directus:** o `ortelius` lê `directus_files` (`filename_disk`, `type`, `modified_on`) só
  para localizar o arquivo, sempre sem escrita.

**Alternativas descartadas:**
- Abrir `/assets` do Directus ao público: o front passaria a depender do Directus e qualquer arquivo
  enviado ficaria público.
- Bucket público com CDN agora: obriga a decidir a hospedagem antes da hora e também exporia os
  rascunhos.

### 1.3 Contrato

`EntityDetail.cover` substitui `cover_media`:

```json
{
  "id": "…",
  "alt_text": "…",
  "caption": "Mosaico de Virgílio entre Clio e Melpômene",
  "author": "David Bjorgen",
  "license": { "code": "public_domain", "label": "Domínio público", "url": null },
  "source_url": "https://commons.wikimedia.org/wiki/File:…",
  "width": 1785,
  "height": 1731,
  "renditions": [{ "width": 480, "path": "/v1/media/…/480.webp?v=…" }, …]
}
```

`cover` é `null` sem capa. `width` e `height` do original deixam o front reservar o espaço da imagem
sem a página "pular". As `renditions` só listam larguras menores ou iguais ao original.

### 1.4 O navegador busca a imagem pelo Next

O endereço da API (`ORTELIUS_API_URL`) é só do servidor. O Next ganha uma rewrite:
`/midia/:path*` → `${ORTELIUS_API_URL}/v1/media/:path*`. O navegador fala só com a origem do Atlas:
sem CORS, sem expor a API. O front monta `srcset` com as `renditions`.

- **Sem `next/image`:** ele reprocessaria um WebP já otimizado. Uso `<img srcset sizes>` com
  `width`/`height`.
- **Falha de imagem:** um componente cliente mínimo esconde a capa no `onError`, e a página segue sem
  ela.
- **`og:image`:** usa a largura de 1600, em URL absoluta via `metadataBase` (`SITE_URL`). Se `SITE_URL`
  não estiver definida, a página sai sem `og:image`.

### 1.5 Desenvolvimento local

Hoje os uploads ficam num volume nomeado do Docker, que a API rodando no host (`uv run`) não lê. O
`compose.yaml` passa a montar `./var/uploads:/directus/uploads` (gitignored). A API lê
`MEDIA_ROOT=./var/uploads`. Uma única vez, com backup antes, os arquivos atuais são copiados do volume
para a pasta. O README documenta o passo.

## 2. Migração das capas atuais

1. A migration `0009` cria `media` e `entities.cover_id` e **mantém** `cover_media` por enquanto
   (reversível).
2. O script `scripts/migrar_capas.py` roda por padrão sem gravar nada:
   - lê `directus_files.description` das capas atuais;
   - reconhece o padrão "Autor: … Licença: … Fonte: …";
   - cria `media` e aponta `cover_id` para as 5 que batem;
   - lista as 5 sem procedência.
   Com `--aplicar` ele grava, mas só depois da sua revisão.
3. Para as 5 sem procedência: eu busco candidatas no Wikimedia Commons e você escolhe no painel. Sem
   imagem aceitável, a entidade fica sem capa.
4. Com tudo conferido, a migration `0010` remove `cover_media`. Fica num PR separado, depois da
   migração do conteúdo.

## 3. Pontos de commit

**`ortelius` (branch `feat/capa-entidade`)**
1. Migration `0009`, modelo e testes de banco (obrigatórios, lista de licenças, `^https?://`, FK com
   `SET NULL`).
2. Painel:
   - coleção "Imagens" (`media`) com upload, campos obrigatórios e licença em lista;
   - campo "Imagem de capa" na entidade com criação inline;
   - montagem por pasta no `compose.yaml`;
   - README.
3. `MediaStorage` local e `GET /v1/media/...`, com testes:
   - capa publicada × rascunho × arquivo solto;
   - largura fora da lista;
   - não ampliar;
   - cache;
   - tipo não aceito;
   - imagem-bomba.
4. `EntityDetail.cover` no contrato e testes da API.
5. `scripts/migrar_capas.py` com testes; você executa.
6. (PR separado) Migration `0010`, que remove `cover_media`.

**`oAtlas` (branch `feat/capa-entidade`)**
7. `api:sync`, rewrite `/midia`, `EntityCover` no cabeçalho da página com legenda e crédito, fallback
   no `onError` e `og:image`. Testes do crédito (licença com e sem link) e do `srcset`.

O layout imersivo continua na issue de layout. Aqui a capa entra no cabeçalho atual, de forma simples.

## 4. Testes

- **`ortelius`:** pytest com PostGIS real.
  - Imagens de teste geradas pelo Pillow em diretório temporário; nada de arquivo binário no repositório.
  - Um teste confirma que uma mídia sem entidade publicada nunca é servida.
- **`oAtlas`:** Vitest com `renderToStaticMarkup`, como nos componentes da página. O E2E da issue 5
  cobre a capa na página final.

## 5. Como pode falhar

| Falha | Comportamento |
|---|---|
| Original ausente no armazenamento | 404 na imagem e log com `file_id`. A página esconde a capa e mostra o resto. |
| Pillow não abre o arquivo (corrompido, tipo errado) | 404 e log. O painel não impede o upload, mas a capa não aparece. Para o revisor detectar, o painel mostra a prévia. |
| Primeiro acesso a um tamanho (geração) | Algumas centenas de ms numa capa grande; os seguintes vêm do cache. |
| Cache em disco cresce | Limitado a 3 tamanhos por capa e por versão. As versões antigas se limpam apagando a pasta, sem risco. |

## 6. Decisões que preciso de você

1. **Licenças aceitas:** a tabela da spec §4, com CC BY-SA dentro e NC/ND fora.
2. **Entrega:** pelo `ortelius`, com a rewrite `/midia` no Next.
3. **Tabela `media`** em vez de campos extras em `directus_files`.
4. **Mudar os uploads para uma pasta montada** no `compose.yaml` (`var/uploads`), copiando os arquivos
   atuais com backup antes.
