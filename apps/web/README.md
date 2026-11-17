# Atlas — web

```bash
cp .env.example .env.local   # preencher o token do Cesium ion
npm install
npm run dev
```

Node 24 (`.nvmrc`). Testes: `npm test`.

## API do ortelius

A página lê a API no servidor, pelo endereço em `ORTELIUS_API_URL` (só do servidor). O contrato vem do OpenAPI
do `ortelius`: `lib/api/openapi.json` é o snapshot versionado e `lib/api/generated/` traz os schemas Zod gerados a
partir dele (não edite à mão). Respostas fora do contrato viram erro controlado; seções inválidas são descartadas e
registradas no log.

```bash
npm run api:sync    # com o ortelius rodando: atualiza o snapshot e regenera os schemas
npm run api:check   # falha se os schemas gerados não batem com o snapshot commitado
```

## Assets

- `public/images/globe-poster-*.webp`: imagem exibida enquanto o globo carrega. Renderizada pelo Cesium com a
  câmera inicial de `adapters/cesium/createCesiumGlobe.ts` sobre a textura *Blue Marble* da NASA (domínio público).
  Se a câmera inicial mudar, a imagem precisa ser gerada de novo.
