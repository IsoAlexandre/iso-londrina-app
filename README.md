# ISO Londrina — App de Apresentação Institucional e Orçamentos

PWA (Progressive Web App) instalável e 100% offline, usado por vendedores em tablets
durante reuniões comerciais presenciais da **ISO Londrina** (Instituto de Saúde
Ocupacional de Londrina). Permite apresentar a empresa, seus serviços, e montar
orçamentos ao vivo — plano por grau de risco, treinamentos, exames complementares e
Nexo Causal/Concausal — gerando uma proposta comercial final em PDF, e-mail ou WhatsApp.

Evoluído a partir de um protótipo HTML/CSS/JS de arquivo único (ver histórico de
decisões no final deste documento).

## Estrutura do projeto

```
index.html               estrutura das 8 abas (views)
manifest.webmanifest      metadados do PWA (ícone, nome, cores)
sw.js                     service worker (cache offline)

css/style.css             estilos, paleta, tipografia (com @font-face local)
fonts/                    Inter e Fraunces self-hosted (variable fonts, subset latin)

data/default-data.json    preços e textos de fábrica — SEPARADO da lógica da interface

js/main.js                ponto de entrada: liga os módulos, expõe funções para os
                           handlers onclick/oninput do HTML, registra o service worker
js/vendor/jspdf.umd.min.js  jsPDF vendorizado localmente (funciona offline)
js/modules/
  db.js                    wrapper de IndexedDB (armazenamento local)
  state.js                 estado em memória compartilhado entre módulos
  data.js                  carregar/mesclar/salvar/exportar/importar a camada de dados
  validate.js              regras de validação (preço >=0, texto obrigatório)
  ui.js                    formatação, toast, modal de confirmação
  nav.js                   navegação entre abas
  pricing.js                cálculos puros (faixas de treinamento/orçamento)
  render-content.js         renderização do catálogo (serviços, treinamentos, exames, Nexo)
  render-budget.js          renderização do fluxo de orçamento (cadastro, carrinho)
  session.js                 cadastro/carrinho/exames em andamento + persistência
  proposal.js                 texto/HTML da proposta (usado por impressão, e-mail, WhatsApp)
  pdf.js                       geração do PDF real da proposta (jsPDF)
  share.js                     compartilhamento nativo (Web Share) + fallback e-mail/WhatsApp
  editmode.js                  modo de edição, salvar, exportar/importar dados

icons/                    ícone do PWA (placeholder "ISO" — ver seção Logo abaixo)
serve.ps1                 servidor estático local para testes (ver "Rodando localmente")
```

## Como os dados funcionam (preços e textos)

Todo conteúdo que muda com frequência — preços de exames, treinamentos, faixas de
orçamento por grau de risco, valores do Nexo Causal e textos institucionais — vive em
**`data/default-data.json`**, completamente separado do código da interface.

- Na primeira vez que o app abre em um tablet, ele carrega esse arquivo como "padrão de
  fábrica".
- Quando alguém usa o **modo de edição** (botão "✎ Editar dados") e clica em **Salvar
  alterações**, os dados editados ficam salvos localmente no IndexedDB do navegador —
  esse tablet específico passa a usar os valores editados em vez do arquivo de fábrica.
- A validação impede salvar preços negativos ou nomes vazios (aparece um aviso listando
  os problemas).

### Sincronizando preços entre tablets

Como não há backend, a sincronização entre aparelhos é manual, pelo próprio app:

1. No tablet onde os preços foram atualizados, no modo de edição, clique em
   **"⬇ Exportar dados"** — baixa um arquivo `iso-londrina-dados-AAAA-MM-DD.json`.
2. Envie esse arquivo para os outros tablets (WhatsApp, e-mail, pendrive, o que for mais
   fácil).
3. Em cada tablet, no modo de edição, clique em **"⬆ Importar dados"**, selecione o
   arquivo — o app valida antes de aplicar e pede confirmação, já que substitui todos os
   preços/textos atuais.

Importar dados **nunca** afeta o cadastro do cliente nem o carrinho em andamento daquele
tablet — só troca a tabela de preços/textos.

Se algo for editado por engano, o botão **"↺ Padrão de fábrica"** restaura os valores
originais do `default-data.json` (também pede confirmação).

> **Atenção:** publicar uma nova versão do app (redeploy) com um `default-data.json`
> atualizado **não** sobrescreve os dados já editados localmente em um tablet — o
> tablet mantém o que foi salvo por lá. Use exportar/importar para propagar mudanças de
> preço já feitas.

## Cadastro e carrinho (sessão do cliente)

O cadastro da empresa/cliente e o carrinho de itens do orçamento em andamento também
persistem localmente (IndexedDB), sobrevivendo a fechar o app ou a um reinício
inesperado do tablet no meio de uma reunião.

Antes de atender o próximo cliente, use o botão **"↺ Novo orçamento"** (barra lateral,
sempre visível) — ele limpa cadastro, carrinho e lista de exames após confirmação. Essa
ação não pode ser desfeita.

## Rodando localmente (desenvolvimento/testes)

Este projeto não tem build (JavaScript puro via ES modules) — mas o **Service Worker
exige servir os arquivos por http(s) ou localhost**, nunca abrindo `index.html`
diretamente pelo navegador (`file://`), senão a instalação como PWA e o funcionamento
offline não funcionam.

Para testar localmente no Windows, sem precisar instalar Node/Python, use o servidor
incluso:

```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```

Abre em `http://localhost:8080`. (Se preferir e tiver Node ou Python instalado, `npx
serve` ou `python -m http.server` também funcionam.)

## Publicando (deploy)

O app precisa estar hospedado em um endereço HTTPS público para os tablets instalarem o
PWA (a mesma restrição do Service Worker vale para produção). Qualquer host estático
gratuito serve — GitHub Pages, Netlify ou Vercel. Passos gerais:

1. Suba a pasta inteira deste projeto para um repositório Git (`serve.ps1` é só uma
   ferramenta de teste local — pode ficar no repositório sem problema, os hosts
   estáticos simplesmente o ignoram).
2. Configure o host estático apontando para a raiz do repositório (não precisa de passo
   de build).
3. Se publicar no **GitHub Pages de projeto** (`usuario.github.io/repositorio/`), repare
   que o site fica em uma subpasta, não na raiz — todos os caminhos deste projeto já são
   relativos (`./...`) para funcionar nesse cenário sem ajustes.
4. Em cada tablet: abrir o link publicado no navegador (Chrome/Edge no Android, Safari
   no iPad) pelo menos uma vez com internet, e usar a opção **"Adicionar à tela
   inicial"** / **"Instalar app"**. Depois de instalado, funciona offline.

### Atualizando o app publicado

Sempre que qualquer arquivo do app mudar (não os dados de preço — esses são editados
pelo próprio app, ver acima), depois de publicar a nova versão:

1. Abra `sw.js` e mude o valor de `CACHE_VERSION` (ex: `'v1'` → `'v2'`).
2. Publique. Os tablets que já têm o app instalado vão detectar a atualização sozinhos e
   mostrar uma barra "Nova versão disponível" — o app só troca de versão quando o
   vendedor toca em "Atualizar agora" (para não trocar o app no meio de uma
   apresentação).

## Logo / ícone do app

Ainda não há logo oficial da clínica. O ícone atual (`icons/icon-*.png`) é um placeholder
gerado com as iniciais "ISO" nas cores da marca. Para trocar pelo logo real:

1. Gere os arquivos PNG nos mesmos nomes/tamanhos: `icon-192.png` (192×192),
   `icon-512.png` (512×512), `icon-maskable-192.png` e `icon-maskable-512.png` (mesmas
   dimensões, mas com a arte ocupando só a área central seguindo a
   [regra de "safe zone" de ícones maskable](https://web.dev/articles/maskable-icon)),
   e `apple-touch-icon.png` (180×180, fundo opaco).
2. Substitua os arquivos em `icons/` mantendo os mesmos nomes — o `manifest.webmanifest`
   já aponta para eles, não precisa editar mais nada.
3. Pode apagar `icons/source.svg`, `icons/source-maskable.svg` e
   `icons/generate-icons.ps1` — eram só as ferramentas usadas para gerar o placeholder.

## Limitações conhecidas

- **Sincronização de preços é manual** (exportar/importar arquivo) — não há backend
  compartilhado. Se no futuro for necessário que todos os tablets vejam preços
  atualizados automaticamente e em tempo real, será preciso um backend simples (banco de
  dados + API).
- **Compartilhar PDF nativamente** (botão "📤 Compartilhar (PDF)") depende do navegador
  suportar `navigator.share` com arquivos — funciona nos navegadores modernos em
  Android/iOS. Quando não suportado, o app baixa o PDF automaticamente para anexar
  manualmente. Os botões de e-mail/WhatsApp com texto (sem anexo) sempre funcionam,
  independentemente disso.
- **E-mail e WhatsApp por link** (`mailto:`/`wa.me`) enviam o texto da proposta, não o
  PDF anexado — é uma limitação desses protocolos, não do app. Use "Compartilhar (PDF)"
  quando precisar do anexo.

---

## Histórico de decisões (herdado do protótipo original)

Este projeto evoluiu de um protótipo funcional em HTML/CSS/JS puro, com o seguinte
histórico:

### Estrutura de navegação (8 seções, menu lateral fixo)

1. **Início** — hero institucional, números de destaque (20+ anos, 1000+ empresas,
   150K+ atendimentos, cobertura nacional), seção "Pilares Fundamentais" (6 cartões)
2. **Sobre Nós** — missão, visão, apresentação do Dr. Alexandre Zenkiti Hirade
3. **Serviços** — 5 cards clicáveis (Saúde Ocupacional, Segurança do Trabalho, eSocial,
   Qualidade de Vida, Terceirização de SESMT e Gestão Ambulatorial); cada card abre um
   modal com o detalhamento completo do serviço
4. **Cadastro** — dados da empresa, do responsável do cliente, e do representante
   comercial (usado na assinatura da proposta final)
5. **Orçamentos** — calculadora por Grau de Risco (I e II) x funcionários; carrinho
   consolidado com todos os itens somados (plano + treinamentos + Nexo Causal); tabela
   separada de exames complementares (informativa, fora do total); campo de
   parcelamento; geração da proposta final em PDF/impressão, e-mail e WhatsApp
6. **Treinamentos** — catálogo com preços reais, alternando entre Formação/Inicial e
   Reciclagem, com 3 faixas de preço por quantidade de participantes (1 a 5 / 6 a 10 /
   11+); inclui também "Outros treinamentos" (workshops, consultoria SESMT)
7. **Orçamento de Exames** — busca ao vivo entre ~62 exames com valores atualizados,
   adicionáveis a uma tabela informativa separada do orçamento principal
8. **Nexo Causal/Concausal** — produto da clínica (Avaliação de Doenças e Análise de
   Nexo Causal/Concausal Ocupacional), com 3 níveis de serviço e valores fixos

### Paleta e tipografia (aprovadas pelo cliente, não alterar sem novo alinhamento)

Pastel azul (`#7FA7C9` / `#4F7291`), verde (`#7FAE8D`), salmão (`#E2967A` /
`#C97557`), fundo neutro (`#F7F8F6`). Tipografia serifada Fraunces nos títulos,
sans-serif Inter no corpo.

### Ponto em aberto herdado do protótipo

A tabela de preços de treinamentos só define valor para grupos de exatamente 1, de 6 a
10, e acima de 11 pessoas. O protótipo assume que o valor "1 pessoa" também vale como
preço por pessoa para grupos de 2 a 5 — vale confirmar com a clínica se essa lógica está
correta.

### Dados de origem

- Site oficial: isolondrina.com.br (conteúdo institucional, serviços, missão/visão)
- Planilha de exames complementares (`Valores_de_exames_-_Aplicativo.xlsx`) — 62 exames
  categorizados por grupo (Médico, Laboratório/Diagnóstico, Audiometria, Radiografia)
- Planilha de treinamentos (`TABELA_VALORES_PARA_TREINAMENTOS-_ENGMA.xlsx`) — preços
  reais por modalidade e faixa de participantes, incluindo CIPA segmentada por Grau de
  Risco (1 a 4)
- Documentos técnicos do Nexo Causal/Concausal: Tabela Comparativa de Níveis de Serviço
  e Linha de Raciocínio para Análise do Nexo Causal/Concausal Ocupacional
- Modelo oficial de Proposta Comercial (DOCX) — referência para a geração da proposta
  final
- Lista de 17 treinamentos e correções de conteúdo fornecidas diretamente pelo
  responsável do projeto ao longo do desenvolvimento

O padrão de "sidebar + abas + cards" foi replicado de um protótipo anterior chamado
**Nexo Ocupacional**, construído para o mesmo usuário em outro projeto.
