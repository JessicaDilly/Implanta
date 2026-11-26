[README.md](https://github.com/user-attachments/files/35463467/README.md)
# Implanta

**Estudos de implantação de unidades de franquia com quadra de tênis e edificação de apoio.**

O Implanta roda direto no navegador, no computador ou no tablet Android. Com ele você desenha um estudo sobre a imagem de satélite do terreno e confere:

- se a unidade **cabe no local** desejado;
- a **movimentação de terra** a partir do relevo;
- o **impacto da insolação**;
- os **parâmetros urbanos**;
- uma **estimativa do custo de obra**.

Ele também faz o **mapeamento de lotes**, para encontrar terrenos com as características necessárias para implantar uma unidade.

Acesse em: **https://jessicadilly.github.io/Implanta/**

---

## Sumário

1. [Para que serve](#para-que-serve)
2. [Primeiros passos](#primeiros-passos)
3. [Modos One e Pro](#modos-one-e-pro)
4. [Ferramentas](#ferramentas)
5. [Vista 3D](#vista-3d)
6. [Insolação](#insolação)
7. [Terreno e terraplenagem](#terreno-e-terraplenagem)
8. [Orçamento estimado](#orçamento-estimado)
9. [Mapeamento de lotes](#mapeamento-de-lotes)
10. [Exportar](#exportar)
11. [Dados e fontes](#dados-e-fontes)
12. [Limitações](#limitações)
13. [Para desenvolvedores](#para-desenvolvedores)

---

## Para que serve

| Pergunta | Onde o Implanta responde |
|---|---|
| A unidade cabe neste terreno? | Lote, recuos e blocos em escala real, com alerta quando algo passa do recuo |
| Quanto de terra vamos mexer? | Terreno: declividade, plataformas, corte e aterro, taludes e perfis |
| As quadras recebem bom sol? | Insolação: sombras por hora, horas de sol no dia e orientação das quadras |
| O estudo atende à legislação? | Índices: taxa de ocupação, coeficiente, área permeável, altura e checagem da zona |
| Quanto custa a obra? | Orçamento estimado: faixa de investimento por etapa, com ajustes possíveis |
| Onde existem lotes bons? | Mapeamento de lotes: filtro por área, zona e lotes vagos |

---

## Primeiros passos

1. **Abra o aplicativo.** No tablet, use o menu do navegador e escolha **Adicionar à tela inicial** para usar como app.
2. **Busque o endereço** pela lupa. O mapa vai até o local e marca um pino.
3. **Desenhe o lote** pela ferramenta **Lote**:
   - **por medidas:** frente e profundidade;
   - **por vértices:** toque em cada canto do terreno.
4. **Confira os recuos.** Eles ficam na seção 2 da ferramenta Lote.
5. **Insira os elementos** pela barra de baixo, no computador, ou pela roda de ferramentas, no tablet:
   - quadras;
   - edificações e plantas START, STANDARD ou PLUS;
   - estacionamento;
   - árvores.
6. **Ajuste cada elemento** arrastando no mapa ou pela barra do bloco selecionado: girar, medidas, pavimentos, altura, duplicar ou excluir.
7. **Analise** o terreno, a insolação, os índices e o orçamento.
8. **Exporte** o PDF, o DXF ou o KML.

No modo **One**, um guia de 6 passos na tela acompanha esse caminho.

---

## Modos One e Pro

| | **One** | **Pro** |
|---|---|---|
| Para quem | Leitura rápida, apresentação ao franqueado | Análise técnica completa |
| Interface | Ferramentas essenciais e guia de 6 passos | Todas as ferramentas, inclusive mapeamento de lotes e DXF |
| PDF | Prancha única (A3) | Relatório de 6 páginas (A3) |

Troque o modo no canto superior esquerdo (**One / Pro**).

---

## Ferramentas

### Lote
- **Desenhar:** por medidas (frente, profundidade e rotação) ou por vértices.
- **Recuos:** frente e demais divisas. A área edificável aparece tracejada.
- **Resumo:** área, perímetro, frente e área edificável.

### Quadras
- Tênis em piso rápido ou saibro, com área de escape.
- Padel.
- Quadra infantil (8 × 16 m).

### Edificações
- **Edificação genérica:** em alvenaria, com laje, platibanda e telhado embutido de telha metálica.
- **Plantas padrão da franquia:**
  - **START:** container 20 pés;
  - **STANDARD:** START + escritório;
  - **PLUS:** container 40 pés.
- Pela **Biblioteca** você também pode importar outras plantas em DXF.

### Estacionamento
Uma vaga avulsa ou um conjunto de vagas com corredor.

### Árvores
Frondosa, ipê-amarelo, ipê-roxo, palmeira, pinheiro e arbusto. Todas fazem sombra no estudo solar.

### Caminhos
Caminho de **carro** (6 m, com faixa central) e de **pedestre** (1,5 m). Toque nos pontos e depois em **Terminar caminho**. Eles entram na área ocupada, no 3D e no DXF.

### Pincel
- **Desenho livre** com cores (roda de cores) e espessura.
- **Régua:** como no Notas do iPhone. Arraste, gire com a alça ou com dois dedos, e o traço encosta na borda.
- **Guias:** linha, ângulo e cotas.

### Medir
Distâncias no mapa.

### Opções A, B, C
Salve variações do estudo no topo da tela e use **Comparar** para ver os números lado a lado.

---

## Vista 3D

Botão **3D** na barra.

- **Níveis de detalhe:**
  - **Volumes:** massas simples;
  - **Detalhado:** quadras com linhas, rede e alambrado; edificações com janelas, porta, platibanda e telhado metálico; árvores por tipo.
- **Relevo:** o terreno é remodelado pelas plataformas e taludes do projeto.
- **Entorno:** prédios num raio de **1 km** do lote.
- **Insolação:** sombras e luz do sol na data e hora escolhidas.
- **Camadas:** mostrar ou esconder projeto, árvores, vizinhos, entorno, sombras e relevo.
- **Medir:** toque em dois pontos para ver distância, desnível e inclinação. Fora do modo medir, tocar num volume mostra o nome e a altura.
- **Imagem:** salva a vista em PNG com a marca Implanta.

---

## Insolação

Botão do **sol** na barra, também disponível dentro do 3D.

- **Data e hora:** escolha a estação (verão, outono, inverno, primavera), a data e a hora. O botão ▶ anima o sol ao longo do dia.
- **Sombras:** de edificações, árvores, alambrados e vidros das quadras.
- **Vizinhos:** prédios próximos do mapa colaborativo (OpenStreetMap) também fazem sombra.
  - Toque num vizinho para ajustar a altura.
  - Sem altura informada no mapa, usa 6 m.
- **% de sol:** cada elemento mostra quanto está iluminado na hora escolhida.
- **Horas de sol:** mapa de calor com as horas de sol direto no dia.
- **Orientação das quadras:** desvio em relação ao eixo norte–sul e horários de sol baixo na linha de jogo.

---

## Terreno e terraplenagem

Ferramenta **Terreno**.

1. **Visualização:** declividade, elevação, orientação das encostas, corte e aterro, e curvas de nível.
2. **Perfis do terreno:** use **+ Novo perfil** e toque nos pontos inicial e final. Você pode criar quantos perfis quiser. Cada um mostra:
   - o terreno natural;
   - o terreno com o projeto;
   - as divisas do lote;
   - o desnível e a inclinação.
3. **Plataformas e taludes:**
   - cada quadra e edificação vira uma plataforma, na cota média ou numa cota escolhida;
   - o app calcula o corte e o aterro;
   - os taludes são automáticos, de corte e de aterro, com inclinação ajustável;
   - há alerta quando o talude passa da divisa.
4. **3D:** o relevo remodelado aparece na vista 3D.

---

## Orçamento estimado

Botão **R$** na barra, ou **Exportar → R$ Orçamento estimado**.

É o simulador de investimento do painel de arquitetura, **preenchido automaticamente com os dados do estudo**:

| Dado | Vem de |
|---|---|
| Quantidade e piso das quadras de tênis | quadras inseridas |
| Quadra infantil | quadra infantil inserida |
| Padrão da edificação | START e STANDARD = Standard; PLUS = Plus; alvenaria = Premium |
| Área construída | área da planta no DXF × pavimentos |
| Lote | área do lote |
| Desnível acentuado e declive | declividade média do terreno (a partir de 10%) |
| UF da obra | endereço buscado |

**O que você informa:**
- o **valor disponível para investir**;
- se a **quadra é coberta**.

Qualquer dado pode ser alterado no painel (aparece "alterado ↺"), e um toque volta ao valor do estudo.

**O resultado mostra:**
- o total com BDI e a faixa de valores;
- o prazo de obra;
- o veredito: **cabe**, **cabe com ajustes** ou **não cabe**;
- a composição por etapa;
- os ajustes possíveis, como uma quadra a menos, sem cobertura ou saibro no lugar do piso rápido.

> Simulação de ordem de grandeza. A base é o BP 09_2026, calibrado por orçamentos de fornecedores e corrigido por SINAPI (UF) e INCC. Não substitui o estudo orçamentário.

---

## Mapeamento de lotes

Ferramenta **Mapeamento de lotes** (ícone de mapa com lupa, modo Pro).

- **Filtros:** busca lotes da base cadastral da cidade por:
  - área mínima e máxima;
  - zona;
  - somente lotes vagos.
- **Teste de encaixe:** escolha os formatos de unidade a testar. O app verifica em cada lote quais formatos cabem na área edificável, já descontados os recuos.
- **Ficha do lote:** cada lote encontrado mostra a área, a zona, a situação (vago ou edificado), a área edificável e o melhor formato que cabe.
- **Usar no estudo:** um toque leva o lote para o estudo, com o contorno desenhado e o formato que coube.

**Cobertura atual:** protótipo em **Belo Horizonte (bairro Belvedere)**, com a base cadastral da prefeitura. A expansão para outras cidades segue o mesmo processo de preparação de dados (veja [Para desenvolvedores](#para-desenvolvedores)).

---

## Exportar

| Formato | Conteúdo |
|---|---|
| **PDF (One)** | Prancha A3: planta sobre satélite, resumo, quadro de áreas, leitura do estudo e insolação |
| **PDF (Pro)** | Relatório A3 de 6 páginas (lista abaixo) |
| **DXF** | Lote, recuos, blocos e caminhos em camadas, em metros, com origem no centro do lote, para o AutoCAD |
| **KML** | Estudo para o Google Earth |
| **PNG** | Imagem da vista 3D |

**Páginas do relatório Pro:**
1. Implantação
2. Índices e conformidade
3. Terreno e terraplenagem
4. Perfis do terreno
5. Insolação
6. Orçamento estimado

Enquadre o estudo na tela antes de gerar o PDF: a planta sai como está no mapa.

---

## Dados e fontes

| Dado | Fonte |
|---|---|
| Imagem de satélite | Esri World Imagery (Maxar, Earthstar Geographics); Mapbox |
| Mapa de ruas | OpenStreetMap |
| Busca de endereço | OpenStreetMap / Nominatim |
| Elevação do terreno | AWS Terrain Tiles (modelo global, cerca de 30 m de resolução) |
| Prédios do entorno e vizinhos | OpenStreetMap (OpenFreeMap e Overpass API) |
| Lotes (Belo Horizonte) | Base cadastral da Prefeitura de Belo Horizonte |
| Custos | BP 09_2026, orçamentos de fornecedores, SINAPI/IBGE, INCC-M/FGV, CUB/Sinduscon |

O estudo fica salvo automaticamente **no próprio navegador**. Nada é enviado para servidores do Implanta.

---

## Limitações

- **Estudo preliminar.** Recuos, índices e zoneamento precisam ser conferidos na legislação municipal.
- **Relevo aproximado.** A elevação global tem cerca de 30 m de resolução e serve para triagem de viabilidade. Para projeto e orçamento, use **levantamento topográfico**.
- **Vizinhos.** Prédios do OpenStreetMap podem estar incompletos ou sem altura. A altura pode ser ajustada à mão.
- **Orçamento.** Usa os valores-padrão do simulador, sem o banco de parâmetros e de fornecedores do painel de arquitetura. Quando o simulador do painel mudar, o Implanta precisa ser atualizado.
- **Mapeamento de lotes.** Por enquanto cobre só o Belvedere, em Belo Horizonte.
- **Dados locais.** Limpar os dados do navegador apaga os estudos salvos. Exporte o PDF ou o DXF para guardar.

---

## Para desenvolvedores

O app é um **único arquivo HTML**, sem servidor. Usa Leaflet, Turf, jsPDF e MapLibre GL (carregado só quando a vista 3D é aberta).

### Estrutura

```
implantacao/
├── index.html            código-fonte do app
├── build.ps1             gera o arquivo final e a pasta publicar
├── plantas/              plantas padrão em DXF (START, STANDARD, PLUS)
├── dados/                bases de lotes em JSON e o script de preparação
├── manifest.webmanifest  instalação como app
├── icone.svg, icone-192.png, icone-512.png
├── ROADMAP.md            histórico e próximas fases
└── publicar/             arquivos prontos para o GitHub Pages
```

### Gerar a versão para publicar

```powershell
powershell -ExecutionPolicy Bypass -File build.ps1
```

O build embute as plantas DXF e as bases de lotes dentro do `index.html` e copia tudo para `publicar/`.

### Publicar no GitHub Pages

No repositório, use **Add file → Upload files**, envie todo o conteúdo da pasta `publicar/` e confirme o commit. O site atualiza em 1 a 2 minutos.

### Adicionar uma nova cidade ao mapeamento de lotes

1. Obtenha a base cadastral de lotes da cidade (geometria, área, zona e situação de ocupação).
2. Converta para o formato de `dados/belvedere.json`, usando `dados/preparar-lotes.ps1` como modelo.
3. Coloque o JSON em `dados/` e rode o build.

### Atualizar o orçamento

O cálculo foi copiado do simulador do painel de arquitetura (módulo `ORC` no `index.html`). Quando o simulador do painel mudar, copie de novo as referências de mercado, o catálogo e as funções de cálculo.
