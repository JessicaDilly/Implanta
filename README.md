# Implanta

Estudo de implantação sobre satélite: lote, recuos, quadras, plantas padrão, terreno, insolação, 3D e exportação KML, DXF e PDF.

Publicado pelo GitHub Pages a partir da `main`: https://jessicadilly.github.io/Implanta/

## Rodar no computador

O app lê as plantas e os lotes de arquivos separados, então precisa de um servidor (aberto direto do disco ele funciona, mas sem plantas padrão e sem lotes):

```
python3 -m http.server 8765
```

e abra http://localhost:8765

## Pastas

```
index.html        só a página: painéis, barras e botões, e a lista de estilos e scripts
css/              estilos, um arquivo por parte da tela
plantas/          plantas padrão em DXF (START, STANDARD, PLUS)
dados/            bases de lotes da prefeitura em JSON (belvedere)
js/
  abertura.js     animação de abertura
  dados.js        lista e baixa as plantas padrão e as bases de lotes
  base/           utilidades usadas em todo o app
  mapa/           mapa 2D (Leaflet): criação e camadas, geometria, endereço, painel de camadas, mapas base
  estudo/         estado do estudo, atualização, métricas, opções A/B/C, desfazer e salvamento
  blocos/         tipos de bloco, desenho, árvores, criar/mover/girar, seleção
  plantas/        leitor de DXF e biblioteca de plantas importadas
  lote/           lote e recuos, lotes do cadastro da prefeitura
  interface/      modos One e Pro, menu de ferramentas, catálogo, roda TOOLS
  ferramentas/    medir, caminhos, pincel, régua, roda de cores, guias
  orcamento/      simulador e orçamento do estudo
  exportacao/     KML e DXF, PDF, Google Earth
  sol/            posição do sol, vizinhos, sombras e horas de sol, barra de insolação
  terreno/        elevação, taludes, terreno modificado, perfis, painel
  3d/             relevo, modelo do estudo, camadas do 3D, vista 3D, ferramentas, chão, quadras em Three.js, caminhar
  iniciar.js      abre o último estudo salvo e recebe as plantas e os lotes quando chegam
```

## Regras

- **A ordem dos `<script>` no `index.html` importa.** Os arquivos dividem o mesmo escopo global: um arquivo pode usar no carregamento só o que os de cima já definiram. Dentro de funções e eventos pode usar qualquer coisa. Para ligar um botão a uma função de um arquivo de baixo, use `() => funcao()` em vez de `funcao`.
- **A ordem dos estilos também importa**: em empate, vale a regra do arquivo de baixo.
- **Nova planta padrão**: coloque o `.dxf` em `plantas/` e acrescente o nome em `PLANTAS_PADRAO`, em `js/dados.js`.
- **Nova base de lotes**: coloque o `.json` em `dados/` e acrescente o nome em `BASES_LOTES`, no mesmo arquivo.
- Não há build: o que está nas pastas é o que vai para o ar. Ao publicar, suba as pastas junto com o `index.html`.
