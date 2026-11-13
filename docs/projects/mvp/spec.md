# MVP do Atlas — Especificação

> **Status:** rascunho para aprovação
> **Escopo:** o que o MVP entrega e por quê. Decisões técnicas ficam em `plan.md`.

## 1. Problema

Conhecimento sobre lugares, povos, impérios e acontecimentos existe, mas
está fragmentado: enciclopédias isolam assuntos, mapas não contam
histórias e cursos impõem trilhas. Falta uma forma de explorar o mundo
por curiosidade, partindo do espaço geográfico, e perceber como passado
e presente se conectam.

## 2. Objetivo do MVP

Validar a hipótese central do Atlas:

> **Pessoas exploram mais e por mais tempo quando o conhecimento é
> acessado a partir de um globo, com páginas profundas e conectadas.**

O MVP precisa provar três coisas, nesta ordem:

1. **Explorar:** o globo é agradável, fluido e convida à descoberta.
2. **Conhecer:** as páginas imersivas sustentam leitura profunda e
   confiável.
3. **Relacionar:** o usuário navega de um assunto a outro pelas
   relações, sem voltar à busca.

Tudo que não contribui para validar essa hipótese fica fora.

## 3. Público do MVP

Pessoa curiosa, adulta, que lê por interesse próprio sobre história,
geografia e cultura. Não é estudante cumprindo tarefa nem pesquisador
acadêmico.

## 4. Escopo

### 4.1 Dentro

**Globo**
- Globo realista em escala monumental, rotação lenta automática,
  arraste, zoom suave e relevo.
- Detalhes cartográficos discretos: grade sutil, nomes de continentes,
  países e cidades conforme a aproximação.
- Cobertura geográfica básica mundial.

**Pontos de descoberta**
- Marcadores em três níveis: principais, secundários e especiais.
- Visibilidade conforme aproximação e relevância.
- Primeiro clique destaca em dourado e abre um cartão inferior com nome,
  imagem e descrição curta, sem esconder o globo.
- Ação "Explorar" leva à página completa.

**Camada histórica e tempo**
- Uma camada de conhecimento ativável pela navbar: **História**.
- Fronteiras e territórios para um conjunto fechado de períodos da
  região prioritária.
- Linha do tempo compacta que permite escolher período ou ano e atualiza
  o que aparece no globo.

**Páginas imersivas**
- Página dedicada por entidade, com introdução, navegação por seções que
  acompanha a rolagem, relações clicáveis e fontes.
- Estrutura própria por tipo de entidade, não um template único.
- Transição do globo para a página que preserve a sensação de
  continuidade.

**Busca**
- Busca global por nome e nomes alternativos (históricos, variantes,
  transliterações).
- Resultado com localização posiciona o globo; sem localização abre a
  página direto.

**Fontes**
- Toda entidade publicada tem ao menos uma fonte.
- Fontes cadastradas uma vez e reutilizadas (Biblioteca Central).
- Distinção visível entre fato estabelecido e interpretação, quando
  aplicável.

**Conteúdo**
- Aprofundamento editorial no Mediterrâneo, Europa e Oriente Médio,
  incluindo o Norte da África.
- Volume inicial definido em §7.

**Produção e revisão de conteúdo**
- Produção híbrida: a coleta automatizada a partir de fontes abertas gera
  rascunhos de entidades, com fonte e licença de origem registradas.
- Um revisor do time revisa, corrige e publica os rascunhos pelo painel,
  sem depender de código. Também pode cadastrar entidades manualmente.
- Nada é publicado sem revisão humana.
- Conteúdo tem estado de rascunho e publicado; só publicado aparece no
  Atlas.
- Publicação bloqueada para entidade sem fonte.
- Só entram fontes com licença compatível com o uso pretendido.
- Acesso ao painel restrito a contas convidadas.
- Geometrias históricas não são editadas no painel; entram pelo
  processo de dados geográficos, com procedência.

### 4.2 Fora (com motivo)

| Item | Motivo |
|---|---|
| Camadas Geografia, Literatura, Cultura, Personalidades, Acontecimentos | Uma camada basta para validar o mecanismo; as demais reutilizam a mesma infraestrutura. |
| Linha do tempo expandida | A compacta valida a navegação temporal. |
| Mapas históricos 2D | O globo com camada histórica cobre o caso principal. |
| Mapa visual de conexões | Fase 2. Relações clicáveis na página já validam "relacionar". |
| Contas, perfil, conquistas | Fase 2. Não são necessários para validar a hipótese. |
| Colaboradores externos e fluxo de revisão | Fase 3. |
| Identidade sonora | Opcional; não afeta a hipótese. |
| Atualidades | Exige processo editorial contínuo que o MVP não sustenta. |
| Logotipo final | Usa versão provisória. |

## 5. Jornadas principais

1. **Descoberta pelo globo:** abre o Atlas → contempla o globo girando →
   arrasta até o Mediterrâneo → aproxima → vê Roma destacada → clica →
   lê o cartão → "Explorar" → página de Roma.
2. **Descoberta pelo tempo:** ativa História → escolhe 117 d.C. → vê o
   território do Império Romano → clica no território → página do
   Império Romano.
3. **Navegação por relações:** na página do Império Romano → clica em
   Júlio César → página de Júlio César → clica em Guerras Gálicas.
4. **Busca:** digita "Bizâncio" → encontra Constantinopla/Istambul pelo
   nome histórico → globo posiciona → página.
5. **Entidade sem lugar:** busca "Eneida" → abre a página da obra sem
   mover o globo.

## 6. Requisitos não funcionais

- **Desempenho percebido:** o globo aparece rápido e permanece fluido em
  notebook comum. Meta numérica em §7.
- **Dispositivos:** desktop é o alvo principal; mobile precisa funcionar
  sem quebrar, não precisa ser a melhor experiência.
- **Confiabilidade:** falha em uma camada, imagem ou página não derruba
  o globo. O usuário vê um estado claro, não uma tela vazia.
- **Procedência:** nenhuma geometria histórica ou conteúdo publicado sem
  fonte registrada.
- **Idioma:** português.
- **Licenças:** todo dado, texto e imagem usado tem licença compatível
  com o uso pretendido e atribuição exibida.

## 7. Decisões de negócio

| Tema | Decisão |
|---|---|
| Produção de conteúdo | Híbrida: rascunhos gerados automaticamente a partir de fontes abertas, revisados e publicados por um revisor do time (hoje, o próprio desenvolvedor). Nada é publicado sem revisão humana. |
| Uso | Não comercial. |
| Volume | 50–100 entidades com página completa, concentradas em poucos temas da região prioritária para que as relações entre elas sejam densas. |
| Desempenho | Em notebook comum: algo visível do planeta em até 2 s no 4G lento (1,6 Mbps, 150 ms) e globo interativo em até 5 s no 4G típico (9 Mbps, 60 ms). Revisada após a medição da prova de conceito: o globo interativo em 4 s é impossível no 4G lento e, no 4G típico, fica limitado pelo download do Cesium e pela autorização do provedor de imagens. |
| Prazo | Sem data-alvo. A entrega é guiada pelas fases do plano. |

### 7.1 Critério de sucesso

A hipótese é avaliada por três sinais, coletados sem identificar o
usuário:

- **Páginas por sessão:** quantas páginas uma pessoa abre por visita.
- **Origem da navegação:** proporção de páginas abertas por relações e
  pelo globo, comparada com as abertas pela busca. Relações e globo
  dominando indica que "explorar" e "relacionar" funcionam.
- **Tempo na página:** indica se o conteúdo sustenta leitura profunda.

Não há metas numéricas iniciais: os primeiros dados formam a linha de
base, e as metas são definidas a partir dela.

### 7.2 Períodos

Seis recortes, escolhidos por mostrarem mudanças territoriais marcantes
na região prioritária. Todos têm fronteiras.

**Abrangência:** as fronteiras históricas cobrem apenas a região
prioritária (Mediterrâneo, Europa, Oriente Médio e Norte da África).
Fora dela, o globo indica de forma clara que não há fronteiras
históricas para o período, sem deixar parecer que o território estava
vazio ou sem povos.

| Ano | Marco |
|---|---|
| 500 a.C. | Império Aquemênida e Grécia clássica |
| 323 a.C. | Morte de Alexandre |
| 117 d.C. | Auge territorial romano |
| 565 d.C. | Bizâncio sob Justiniano |
| 750 d.C. | Califado no auge e transição Omíada–Abássida |
| 1453 | Queda de Constantinopla |

As fronteiras atuais completam a linha do tempo como "presente".

Regra de navegação: ao escolher um ano sem recorte próprio, o globo
mostra o recorte anterior mais próximo e informa qual ano está sendo
exibido.

## 8. Critérios de aceite

- As cinco jornadas de §5 funcionam de ponta a ponta com conteúdo real.
- Toda entidade publicada tem fonte visível.
- Desligar a fonte de dados históricos não impede o uso do globo nem das
  páginas.
- Atribuições de imagens e dados visíveis na interface.
- Um rascunho gerado automaticamente é revisado, corrigido e publicado
  pelo painel, com seções, relações, fonte e imagem, sem mexer em código.
- Toda entidade gerada automaticamente registra a fonte e a licença de
  origem dos dados e do texto.
- Meta de desempenho de §7 atendida.
- Os três sinais de §7.1 são coletados desde o lançamento.
