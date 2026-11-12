# Atlas — web

```bash
cp .env.example .env.local   # preencher o token do Cesium ion
npm install
npm run dev
```

## Assets

- `public/images/globe-poster-*.webp`: imagem exibida enquanto o globo carrega. Renderizada pelo Cesium com a
  câmera inicial de `adapters/cesium/createCesiumGlobe.ts` sobre a textura *Blue Marble* da NASA (domínio público).
  Se a câmera inicial mudar, a imagem precisa ser gerada de novo.
