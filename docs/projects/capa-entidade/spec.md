# Capa da entidade — Especificação

> **Status:** rascunho para aprovação
> **Escopo:** o que a capa entrega e por quê. Decisões técnicas ficam em `plan.md`.
> **Issue:** oAtlas #6. Envolve `ortelius` (dados, painel, API) e `oAtlas` (página).

## 1. Problema

A página da entidade não tem nenhuma imagem: a primeira tela é título e texto, e o leitor não é
convidado a ficar (avaliação da issue 3). A capa já existe no painel, mas não chega ao público:

- **Entrega:** o Directus serve os arquivos em `/assets/<id>` e devolve 403 sem login. Abrir isso ao
  público quebraria a regra "o frontend nunca chama o Directus" (plano do MVP, §3.4).
- **Procedência:** o painel aceita capa sem origem. No aceite da fase 2b entraram imagens de banco
  com direitos autorais (Getty). Hoje, das 10 entidades publicadas, 5 têm autor, licença e fonte
  escritos à mão na descrição do arquivo, e 5 não têm nada.

A spec do MVP exige que toda imagem tenha licença compatível e atribuição exibida (§6), e que falha
de imagem não derrube a página.

## 2. Objetivo

Toda entidade publicada pode ter uma capa que:

1. aparece na página da entidade (e depois no cartão de prévia do globo, Fase 4);
2. tem autor, licença e fonte registrados de forma estruturada, conferidos no painel antes de publicar;
3. exibe o crédito junto da imagem, com link para a licença e a fonte;
4. carrega rápido no celular e no desktop, no tamanho certo para cada tela.

## 3. Escopo

### 3.1 Dentro

**Painel (editor)**
- Cadastro da capa com campos obrigatórios: arquivo, texto alternativo, legenda, autor, licença
  (lista fechada) e link da fonte.
- Publicar uma entidade com capa sem esses campos é bloqueado, com mensagem em linguagem de editor.
- Uma imagem cadastrada pode ser reaproveitada como capa de outra entidade.

**API**
- A entidade devolve a capa com legenda, texto alternativo, crédito e as URLs da imagem em alguns
  tamanhos, ou `null` quando não há capa.
- A imagem é servida pelo `ortelius`, nunca pelo Directus, e só quando é capa de uma entidade
  publicada.

**Página**
- Capa no topo da página da entidade, com legenda e crédito ("Autor · Licença · Fonte").
- Sem capa ou com falha ao carregar, a página continua com o layout sem imagem, sem buraco.
- A capa também vira a imagem de compartilhamento (`og:image`).

**Conteúdo**
- As 5 capas com crédito em texto livre migram para os campos estruturados.
- As 5 capas sem procedência (Eneida, Guerras Gálicas, Império Romano, Júlio César, Roma) são
  substituídas por imagens de origem conhecida ou removidas até haver uma.

### 3.2 Fora

- Layout imersivo da página (issue de layout B + A), que usa esta capa.
- Imagens dentro do texto (bloco de imagem) e galerias.
- Cartão de prévia no globo (Fase 4), que reaproveita a mesma capa.
- Busca automática de imagens no pipeline (por exemplo, via Wikimedia Commons). Pode vir depois e já
  encontra os campos prontos.
- Recorte manual por ponto focal. O enquadramento é automático no MVP.

## 4. Licenças aceitas

| Licença | Aceita | Motivo |
|---|---|---|
| Domínio público | Sim | Sem restrição. |
| CC0 | Sim | Sem restrição. |
| CC BY | Sim | Exige atribuição, que a página exibe. |
| CC BY-SA | Sim | Exige atribuição. Redimensionar não cria obra derivada; se um dia houver edição da imagem, ela sai sob a mesma licença. |
| CC BY-NC, CC BY-ND e variações | Não | NC impede uso comercial futuro. ND é ambíguo para recortes. |
| Direitos reservados, banco de imagens, "encontrei no Google" | Não | Sem licença para o Atlas. |

A lista é fechada no painel: não existe opção "outra".

## 5. Critérios de aceite

- As 10 entidades publicadas abrem com capa e crédito estruturado, ou sem capa quando nenhuma imagem
  de origem conhecida foi encontrada. Nenhuma fica sem crédito.
- Tentar publicar uma entidade com capa sem autor, licença ou fonte é bloqueado no painel.
- Um arquivo que não é capa de entidade publicada (rascunho, arquivo solto) responde 404 na API.
- A página não chama o Directus. A imagem chega no tamanho da tela: abaixo de 200 KB no celular para a
  capa padrão.
- Com a imagem indisponível, a página aparece inteira, sem imagem quebrada.
- O crédito tem link para a fonte e para o texto da licença.

## 6. Riscos

- **Achar imagens livres** para conceitos abstratos ("Império Romano") pode ser difícil. Uma entidade
  sem capa é aceitável; uma capa sem licença, não.
- **Atribuição errada** em imagens do Commons, porque autor e licença variam por arquivo. A revisão
  humana confere a página de origem.
