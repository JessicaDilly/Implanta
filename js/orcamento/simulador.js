// ---------- Orçamento estimado (simulador do painel Fast Tennis, copiado do painel em 21/11/2026) ----------
// Cálculo idêntico ao "Simulação de investimento" do painel: BP 09_2026 item a item, calibrado por orçamentos de fornecedores,
// corrigido por SINAPI (UF) e INCC. Aqui roda com os valores-padrão do código (sem o banco de parâmetros e de fornecedores do painel).
var ORC = (function () {
  // dependências do painel, na forma mínima
  var simP = function () { return null; };
  var simPd = function (ch, def) { return def; };
  var simLoteFaixas = function () { return []; };
  var simPrecosForn = function () { return []; };
  var txt = function (v) { return v == null ? '' : String(v).trim(); };
  var engMoeda = function (v) { var n = Number(v); return isNaN(n) ? '—' : n.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL', maximumFractionDigits: 0}); };
  var engNum = function (v, dec) { var n = Number(v); return isNaN(n) ? '—' : n.toLocaleString('pt-BR', {maximumFractionDigits: dec == null ? 2 : dec}); };
const REF_MERCADO = {
  consultadoEm: "2026-10-12",
  sinapi: {
    mesReferencia: "2026-08",
    fonte: "IBGE · SINAPI · custo médio R$/m² (projeto padrão residencial), com e sem desoneração",
    porUF: {"BR": {"comDesoneracao": 1993.76, "semDesoneracao": 2099.73, "varMes": 0.44, "var12m": 7.03}, "RO": {"comDesoneracao": 2190.83, "semDesoneracao": 2299.57, "varMes": 0.09, "var12m": 6.28}, "AC": {"comDesoneracao": 2309.23, "semDesoneracao": 2420.02, "varMes": 0.25, "var12m": 9.57}, "AM": {"comDesoneracao": 2000.18, "semDesoneracao": 2104.84, "varMes": 2.67, "var12m": 6.42}, "RR": {"comDesoneracao": 2137.37, "semDesoneracao": 2247.5, "varMes": 0.42, "var12m": 5.17}, "PA": {"comDesoneracao": 1991.46, "semDesoneracao": 2083.49, "varMes": 0.31, "var12m": 6.25}, "AP": {"comDesoneracao": 2031.0, "semDesoneracao": 2124.87, "varMes": 0.18, "var12m": 7.47}, "TO": {"comDesoneracao": 2072.43, "semDesoneracao": 2169.94, "varMes": 0.71, "var12m": 8.29}, "MA": {"comDesoneracao": 1969.07, "semDesoneracao": 2063.12, "varMes": 0.27, "var12m": 8.97}, "PI": {"comDesoneracao": 1877.25, "semDesoneracao": 1969.01, "varMes": 0.41, "var12m": 6.74}, "CE": {"comDesoneracao": 1883.2, "semDesoneracao": 1974.41, "varMes": 0.0, "var12m": 6.99}, "RN": {"comDesoneracao": 1866.99, "semDesoneracao": 1957.01, "varMes": 0.23, "var12m": 7.95}, "PB": {"comDesoneracao": 1926.4, "semDesoneracao": 2026.3, "varMes": 0.48, "var12m": 9.52}, "PE": {"comDesoneracao": 1789.9, "semDesoneracao": 1881.36, "varMes": 0.28, "var12m": 7.06}, "AL": {"comDesoneracao": 1810.89, "semDesoneracao": 1898.11, "varMes": 0.04, "var12m": 5.72}, "SE": {"comDesoneracao": 1768.44, "semDesoneracao": 1858.61, "varMes": 0.6, "var12m": 6.74}, "BA": {"comDesoneracao": 1873.15, "semDesoneracao": 1969.6, "varMes": 0.06, "var12m": 8.89}, "MG": {"comDesoneracao": 1864.57, "semDesoneracao": 1963.18, "varMes": 0.22, "var12m": 6.98}, "ES": {"comDesoneracao": 1802.13, "semDesoneracao": 1898.78, "varMes": 0.5, "var12m": 6.53}, "RJ": {"comDesoneracao": 2174.65, "semDesoneracao": 2300.67, "varMes": 0.34, "var12m": 6.13}, "SP": {"comDesoneracao": 2089.88, "semDesoneracao": 2209.93, "varMes": 0.06, "var12m": 5.93}, "PR": {"comDesoneracao": 2161.78, "semDesoneracao": 2287.42, "varMes": 2.25, "var12m": 6.73}, "SC": {"comDesoneracao": 2249.47, "semDesoneracao": 2383.87, "varMes": 0.26, "var12m": 6.51}, "RS": {"comDesoneracao": 1962.32, "semDesoneracao": 2062.87, "varMes": 0.14, "var12m": 4.76}, "MS": {"comDesoneracao": 1940.98, "semDesoneracao": 2040.5, "varMes": 2.34, "var12m": 6.87}, "MT": {"comDesoneracao": 2068.0, "semDesoneracao": 2169.08, "varMes": 0.16, "var12m": 9.89}, "GO": {"comDesoneracao": 2009.13, "semDesoneracao": 2112.97, "varMes": 0.01, "var12m": 9.5}, "DF": {"comDesoneracao": 2051.0, "semDesoneracao": 2151.68, "varMes": 2.11, "var12m": 7.45}},
    porRegiao: {"Norte": {"comDesoneracao": 2044.58, "semDesoneracao": 2143.41}, "Nordeste": {"comDesoneracao": 1871.33, "semDesoneracao": 1964.75}, "Sudeste": {"comDesoneracao": 2029.98, "semDesoneracao": 2144.08}, "Sul": {"comDesoneracao": 2130.22, "semDesoneracao": 2251.29}, "Centro-Oeste": {"comDesoneracao": 2025.86, "semDesoneracao": 2127.48}}
  },
  cub: {
    projeto: "R8-N (residencial padrão normal) · onerado",
    fonte: "Sinduscons estaduais (compilado por paggo.com.br); AC, MS e TO sem valor publicado",
    porUF: {"AL": {"valor": 2031.15, "mes": "2026-08"}, "AP": {"valor": 2846.44, "mes": "2026-07"}, "AM": {"valor": 3139.67, "mes": "2026-08"}, "BA": {"valor": 2243.22, "mes": "2026-09"}, "CE": {"valor": 2510.74, "mes": "2026-09"}, "DF": {"valor": 2416.71, "mes": "2026-09"}, "ES": {"valor": 2829.12, "mes": "2026-09"}, "GO": {"valor": 2242.42, "mes": "2026-08"}, "MA": {"valor": 1909.37, "mes": "2026-09"}, "MT": {"valor": 3314.8, "mes": "2026-09"}, "MG": {"valor": 2548.75, "mes": "2026-07"}, "PA": {"valor": 2374.18, "mes": "2026-09"}, "PB": {"valor": 1716.69, "mes": "2026-09"}, "PR": {"valor": 2738.93, "mes": "2026-09"}, "PE": {"valor": 2240.23, "mes": "2026-09"}, "PI": {"valor": 2760.3, "mes": "2026-07"}, "RJ": {"valor": 2476.31, "mes": "2026-09"}, "RN": {"valor": 2150.02, "mes": "2026-08"}, "RS": {"valor": 2943.73, "mes": "2026-09"}, "RO": {"valor": 2430.57, "mes": "2026-09"}, "RR": {"valor": 2845.87, "mes": "2026-09"}, "SC": {"valor": 2811.78, "mes": "2026-09"}, "SE": {"valor": 2067.83, "mes": "2026-09"}, "SP": {"valor": 2238.58, "mes": "2026-09"}}
  },
  incc: {
    serie: "INCC-M · FGV",
    base: "dez/2023 = 100",
    varMensal: {"2024-01": 0.23, "2024-02": 0.2, "2024-03": 0.24, "2024-04": 0.41, "2024-05": 0.59, "2024-06": 0.93, "2024-07": 0.69, "2024-08": 0.64, "2024-09": 0.61, "2024-10": 0.67, "2024-11": 0.44, "2024-12": 0.51, "2025-01": 0.71, "2025-02": 0.51, "2025-03": 0.38, "2025-04": 0.59, "2025-05": 0.26, "2025-06": 0.96, "2025-07": 0.91, "2025-08": 0.7, "2025-09": 0.21, "2025-10": 0.21, "2025-11": 0.28, "2025-12": 0.21, "2026-01": 0.63, "2026-02": 0.34, "2026-03": 0.36, "2026-04": 1.04, "2026-05": 0.77, "2026-06": 0.85, "2026-07": 0.62, "2026-08": 0.85, "2026-09": 0.25},
    indice: {"2023-12": 100.0, "2024-01": 100.23, "2024-02": 100.4305, "2024-03": 100.6715, "2024-04": 101.0842, "2024-05": 101.6806, "2024-06": 102.6263, "2024-07": 103.3344, "2024-08": 103.9957, "2024-09": 104.6301, "2024-10": 105.3311, "2024-11": 105.7946, "2024-12": 106.3341, "2025-01": 107.0891, "2025-02": 107.6353, "2025-03": 108.0443, "2025-04": 108.6817, "2025-05": 108.9643, "2025-06": 110.0104, "2025-07": 111.0115, "2025-08": 111.7885, "2025-09": 112.0233, "2025-10": 112.2586, "2025-11": 112.5729, "2025-12": 112.8093, "2026-01": 113.52, "2026-02": 113.9059, "2026-03": 114.316, "2026-04": 115.5049, "2026-05": 116.3943, "2026-06": 117.3836, "2026-07": 118.1114, "2026-08": 119.1154, "2026-09": 119.4131}
  },
  ufRegiao: {"SP": "Sudeste", "MG": "Sudeste", "RJ": "Sudeste", "ES": "Sudeste", "PR": "Sul", "SC": "Sul", "RS": "Sul", "GO": "Centro-Oeste", "DF": "Centro-Oeste", "MT": "Centro-Oeste", "MS": "Centro-Oeste", "BA": "Nordeste", "CE": "Nordeste", "PE": "Nordeste", "PB": "Nordeste", "RN": "Nordeste", "AL": "Nordeste", "SE": "Nordeste", "PI": "Nordeste", "MA": "Nordeste", "AM": "Norte", "PA": "Norte", "RO": "Norte", "RR": "Norte", "AP": "Norte", "AC": "Norte", "TO": "Norte"}
};

// Fator INCC entre a data-base de um orçamento e o mês desejado (padrão: último mês disponível)
function fatorINCC(deMes, ateMes) {
  const i = REF_MERCADO.incc.indice, meses = Object.keys(i).sort();
  const fim = ateMes && i[ateMes] ? ateMes : meses[meses.length - 1];
  const ini = i[deMes] ? deMes : meses[0];
  return i[fim] / i[ini];
}

// Fator regional: custo SINAPI da UF da obra ÷ custo SINAPI da UF de origem do orçamento-base
function fatorRegional(ufObra, ufBase = "SP") {
  const s = REF_MERCADO.sinapi.porUF;
  const a = s[ufObra] || s.BR, b = s[ufBase] || s.BR;
  return a.comDesoneracao / b.comDesoneracao;
}

// Corrige um valor de orçamento antigo para hoje e para a UF da obra
function corrigirValor(valor, { dataBase, ufBase = "SP", ufObra }) {
  return valor * fatorINCC(dataBase) * (ufObra ? fatorRegional(ufObra, ufBase) : 1);
}

var SIM_REF_FORN=[
  {f:"RA Construções", o:"Rua das Flechas/SP", d:"2026-04", v:382159.28, e:"Turn-key: 1 quadra de saibro + edificação em steel frame"},
  {f:"RA Construções", o:"Interlagos/SP", d:"2026-02", v:487305.96, e:"Turn-key: 1 quadra de saibro + edificação em steel frame"},
  {f:"RA Construções", o:"Vila Saúde/SP", d:"2026-05", v:689133.06, e:"Turn-key: saibro + quadra rápida infantil + cobertura metálica de convivência"},
  {f:"RA Construções", o:"Poços de Caldas/MG", d:"2026-08", v:550000, e:"3 quadras (1 rápida asfáltica + 2 saibro), alambrado e iluminação"},
  {f:"R2A Reformas", o:"Ibirapuera/SP", d:"2026-08", v:405000, e:"Obra civil (steel frame) + quadra rápida"},
  {f:"R2A Reformas", o:"Giovanni Gronchi/SP", d:"2026-03", v:330766.59, e:"Obra civil (steel frame), sem quadra"},
  {f:"R2A Reformas", o:"Rua da Prata/SP", d:"2026-05", v:401200, e:"Obra civil (reforma), sem quadra"},
  {f:"R2A Reformas", o:"Porto Alegre/RS", d:"2026-07", v:385478.86, e:"Obra civil para container, sem quadra (inclui R$ 54 mil de mobilização)"},
  {f:"R2A Reformas", o:"Braz Leme/SP", d:"2026-08", v:320000, e:"Obra civil (steel frame) — contrato"},
  {f:"MAGN Reformas", o:"Brooklin/SP", d:"2025-06", v:407958.85, e:"Obra civil para containers, sem quadra"},
  {f:"LC Construtora", o:"Rua da Prata/SP", d:"2026-03", v:504300, e:"Obra civil + quadra"},
  {f:"LC Construtora", o:"Jacarepaguá/RJ", d:"2026-10", v:518800, e:"Obra civil + quadra em asfalto frio"},
  {f:"Eduardo Lacerda", o:"Rua da Prata/SP", d:"2026-05", v:600000, e:"Reforma + 1 quadra rápida (R$ 158 mil)"},
  {f:"Eduardo Lacerda", o:"Porto Alegre/RS", d:"2026-07", v:573500, e:"2 quadras de saibro (1 infantil) + obra civil, sem container"},
  {f:"Tênis na Onda", o:"Braz Leme/SP", d:"2026-08", v:125000, e:"1 quadra de saibro + alambrado + iluminação — contrato"},
  {f:"Casalechi", o:"Lagoa dos Ingleses/MG", d:"2026-07", v:130527, e:"1 quadra de saibro + alambrado + iluminação (mão de obra + materiais diretos)"},
  {f:"Sport Piso", o:"Ribeirão Preto/SP", d:"2026-07", v:338250, e:"2 quadras de saibro + alambrado + iluminação"},
  {f:"Max Quadra", o:"Porto Alegre/RS", d:"2026-07", v:290000, e:"2 quadras de saibro + alambrado + iluminação"},
  {f:"Max Quadra", o:"Anália Franco/SP", d:"2026-05", v:256000, e:"1 quadra asfáltica + mini quadra, alambrado e iluminação"},
  {f:"Leo", o:"Porto Alegre/RS", d:"2026-07", v:220000, e:"2 quadras de saibro (sem iluminação)"},
  {f:"Jacobi", o:"Porto Alegre/RS", d:"2026-07", v:550225.25, e:"2 quadras de saibro + radier + muros"},
  {f:"BGL Engenharia", o:"Porto Alegre/RS", d:"2026-07", v:520000, e:"2 quadras de saibro + edificação + estacionamento (sem materiais)"},
  {f:"RF Leasing", o:"Curitiba/PR", d:"2026-02", v:94900, e:"Container 40' HC customizado com Glasroc (sem frete)"},
  {f:"Conbrazil", o:"Ribeirão Preto/SP", d:"2026-07", v:93900, e:"Container 40' HC customizado (sem frete)"},
  {f:"Arka Engenharia", o:"Poços de Caldas/MG", d:"2026-09", v:356522, e:"Montagem de cobertura metálica de 1.824 m² (estrutura fornecida pelo cliente)"}
];
/* cobertura metálica (R$/m², preço do fornecedor) — referência da cobertura de quadra e da área de convivência */
var SIM_REF_COB=[
  {f:"RA Construções", o:"Vila Saúde/SP", v:383, m2:128, e:"com fundações de 2 m e blocos de coroamento"},
  {f:"R2A Reformas", o:"Ibirapuera/SP", v:480, m2:65.6, e:"telha sanduíche"},
  {f:"R2A Reformas", o:"Giovanni Gronchi/SP", v:470, m2:54.61, e:"telha trapezoidal"},
  {f:"R2A Reformas", o:"Porto Alegre/RS", v:480, m2:98.01, e:"telha galvanizada"},
  {f:"MAGN Reformas", o:"Brooklin/SP", v:420, m2:116.34, e:"telha trapezoidal"}
];
/* quadra completa (piso + alambrado + iluminação), preço por quadra */
var SIM_REF_QUADRA=[
  {f:"Tênis na Onda", o:"Braz Leme/SP", v:125000}, {f:"Casalechi", o:"Lagoa dos Ingleses/MG", v:130527},
  {f:"Max Quadra", o:"Porto Alegre/RS", v:145000}, {f:"Sport Piso", o:"Ribeirão Preto/SP", v:169125},
  {f:"RA Construções", o:"Poços de Caldas/MG", v:171122}
];
var SIM_REF_CONT=[{f:"RF Leasing", o:"Curitiba/PR", v:94900}, {f:"Conbrazil", o:"Ribeirão Preto/SP", v:93900}];
function simMediana(a){ return engQuartil(a.map(function(x){ return x.v; }),.5); }
function simRefTxt(a,fmt){ return a.map(function(x){ return x.f+" "+x.o+": "+fmt(x.v); }).join("; "); }
var SIM_BP_OBRA=410000;
var SIM_BDI_CALIB=0.25;
function engQuartil(arr,q){ var a=arr.slice().sort(function(x,y){return x-y;}); if(!a.length) return null;
  var p=(a.length-1)*q, b=Math.floor(p), r=p-b; return a[b+1]!==undefined? a[b]+r*(a[b+1]-a[b]) : a[b]; }
function simLotePct(lote){
  var fx=simLoteFaixas().slice().sort(function(a,b){ return (a.ate==null?9e15:+a.ate)-(b.ate==null?9e15:+b.ate); });
  for(var i=0;i<fx.length;i++){ if(fx[i].ate==null||lote<=+fx[i].ate) return +fx[i].pct; }
  return 100;
}
function simCatalogo(c){
  var S=[];
  var it=function(f,cod,d,u,q,v,corr,ref){ return {fonte:f,cod:cod,desc:d,und:u,q:Math.round((q||0)*100)/100,v:v,corr:corr,ref:ref||""}; };
  var sub=function(t){ return {sub:t}; };
  var sec=function(nome,bdi,itens,extra){ S.push(Object.assign({nome:nome,bdi:bdi,itens:itens.filter(Boolean)},extra||{})); };
  var nQ=c.nQ, cobFinal=c.cobFinal;

  sec("MOBILIZAÇÃO, SERVIÇOS PRELIMINARES E LIGAÇÕES",true,[
    it("CALIBRADO","-","CANTEIRO DE OBRA: ABRIGO, BANHEIRO PROVISÓRIO E BEBEDOURO","MÊS",c.meses,1200,"forn","R2A R$ 1.800/mês; RA R$ 3.785 por obra"),
    it("CALIBRADO","-","ADMINISTRAÇÃO E GESTÃO DA OBRA (ACOMPANHAMENTO TÉCNICO, LOGÍSTICA E INSUMOS)","MÊS",c.meses,2400,"forn","RA R$ 7 a 8 mil por obra; Jacobi R$ 18,5 mil"),
    it("BP","-","PADRÃO DE ENTRADA DE ENERGIA TRIFÁSICO COM POSTE, CAIXA DE MEDIÇÃO, DISJUNTOR GERAL E ATERRAMENTO","UND",1,3556.45,"bp"),
    it("CALIBRADO","-","FORNECIMENTO E COLOCAÇÃO DE CABO DE ENTRADA DO RELÓGIO ATÉ O QDC GERAL","VB",1,5500,"forn","BP R$ 2.876,80; R2A R$ 6,2 a 8,3 mil; MAGN R$ 9,6 mil"),
    it("BP","-","LIGAÇÃO DE ÁGUA: CAVALETE/ABRIGO DO HIDRÔMETRO (TAXA NÃO INCLUSA)","UND",1,781.74,"bp")
  ]);
  sec("PROJETOS E APROVAÇÕES",false,[
    it("PRÓPRIO","-","PROJETO DE ARQUITETURA DO FOR YOU (ARQUITETURA E COMPLEMENTARES: ELÉTRICO, HIDROSSANITÁRIO E DRENAGEM)","VB",1,12500,"fixo"),
    it("PRÓPRIO","-","PROJETO DE APROVAÇÃO E EXECUÇÃO DE OBRA JUNTO À PREFEITURA, ART DE RESPONSABILIDADE DA OBRA","VB",1,12000,"fixo"),
    it("PRÓPRIO","-","PROJETO PARA CORPO DE BOMBEIROS P/ AQUISIÇÃO DO AVCB (AUTO DE VISTORIA DO CORPO DE BOMBEIROS)","VB",1,4800,"fixo"),
    it("PRÓPRIO","-","PROJETO ESTRUTURAL: ARRIMO, CONTENÇÕES E ESTRUTURAS","M2",c.arrimo,150,"fixo"),
    c.nCob?it("PRÓPRIO","-","PROJETO ESTRUTURAL DA COBERTURA METÁLICA DA QUADRA E DAS FUNDAÇÕES DOS PILARES","VB",c.nCob,6000,"fixo","estimativa de mercado (item não consta no BP)"):null,
    it("PRÓPRIO","-","TAXAS E LICENÇAS APROVAÇÃO DE PROJETO DE ARQUITETURA JUNTO À PREFEITURA","VB",1,500,"fixo"),
    it("PRÓPRIO","-","TAXA DE LICENÇA PARA MOVIMENTAÇÃO DE TERRA: ATERRO, DESATERRO E BOTA-FORA","VB",1,300,"fixo"),
    it("PRÓPRIO","-","PROCESSO DOCUMENTAL PARA SUPRESSÃO DE ÁRVORES","VB",0,2000,"fixo"),
    it("PRÓPRIO","-","LEVANTAMENTO TOPOGRÁFICO","VB",1,1500,"fixo")
  ]);
  var r=c.radier;
  sec("ADEQUAÇÃO DO TERRENO E RADIER",true,[
    sub("TERRENO"),
    it("CALIBRADO","SETOP ED-51124","REGULARIZAÇÃO, CORTE/ATERRO INTERNO E COMPACTAÇÃO MECÂNICA DO TERRENO (ROLO VIBRATÓRIO)","M2",c.aAdeq,11,"forn","BP R$ 9,14/m² (SETOP + SUDECAP); fornecedores R$ 9,5 a 26 mil por terreno"),
    it("SUDECAP","03.15.03 07/2025","ATERRO COMPACTADO MANUALMENTE COM SOQUETE","M3",30,57.72,"bp"),
    it("CALIBRADO","SUDECAP 40.31","MURO LATERAL E FUNDO: REGULARIZAÇÃO DE MURO EXISTENTE (CHAPISCO, EMBOÇO E REBOCO)","M2",c.muroA,52,"forn","R2A R$ 60/m²; RA R$ 70/m²; MAGN R$ 55/m²"),
    it("SUDECAP","07.06.02 07/2025","MURO NOVO EM ALVENARIA DE BLOCO CERÂMICO E=15 CM COM FUNDAÇÃO CORRIDA, REVESTIDO (QUANDO NÃO HOUVER MURO)","M2",0,167.02,"bp"),
    sub("RADIER SIMPLES DA EDIFICAÇÃO (SEM FUNDAÇÃO PROFUNDA)"),
    it("SUDECAP","19.53.01 07/2025","LASTRO DE PEDRA BRITADA","M3",r*0.0513,221.39,"bp"),
    it("SUDECAP","15.35.31 07/2025","LONA PLÁSTICA PRETA - 200 MICRA","M2",r*1.1,0.38,"bp"),
    it("SUDECAP","40.20.15","FORMA DE COMPENSADO RESINADO E=12MM TIPO B (3 APR)","M2",r*0.31,73.73,"bp"),
    it("SETOP","ED-29549 07/2025","CORTE, DOBRA E MONTAGEM DE AÇO CA 50, DIÂMETRO 6,3MM, INCLUSIVE ESPAÇADOR","KG",r*3.5,13.65,"bp"),
    it("SUDECAP","04.27.25 07/2022","CONCRETO USINADO BOMBEADO FCK >= 25 MPA, LANÇADO EM FUNDAÇÃO (E = 10 CM)","M3",r*0.1,674.83,"bp"),
    it("CALIBRADO","-","MÃO DE OBRA DO RADIER: LOCAÇÃO, GABARITO, ARMAÇÃO, CONCRETAGEM E ACABAMENTO DESEMPENADO","M2",r,150,"forn","Pas Construtora: R$ 13,7 mil de mão de obra na base do container"),
    sub("INFRAESTRUTURA HIDRÁULICA E ELÉTRICA NO RADIER"),
    it("SUDECAP","73.02.01 07/2025","TUBO PVC SOLDÁVEL MARROM D= 20MM (1/2\")","M",25,2.91,"bp"),
    it("SUDECAP","10.10.02 07/2025","TUBO PVC ESGOTO, D= 50MM, PONTA E BOLSA, VIROLA E ANEL, INCLUSIVE CONEXÕES","M",18,23.94,"bp"),
    it("SUDECAP","10.10.04 07/2025","TUBO PVC ESGOTO, D= 100MM, PONTA E BOLSA, VIROLA E ANEL, INCLUSIVE CONEXÕES","M",22,30.43,"bp"),
    it("SETOP","ED-49188 07/2025","CAIXA DE LIGAÇÃO/PASSAGEM EM PVC RÍGIDO 4\"X4\", INCLUSIVE FIXAÇÃO","UN",6,14.78,"bp"),
    it("SETOP","ED-49187 07/2025","CAIXA DE LIGAÇÃO/PASSAGEM EM PVC RÍGIDO 4\"X2\", INCLUSIVE FIXAÇÃO","UN",8,10.96,"bp")
  ]);
  sec("FUNDAÇÕES E CONTENÇÕES",true,[
    c.desn?it("CALIBRADO","SINAPI","CORTE E ATERRO MECANIZADO PARA FORMAÇÃO DE PLATÔS (ESCAVAÇÃO, CARGA, TRANSPORTE E COMPACTAÇÃO)","M3",c.vol,38,"forn","volume estimado pela declividade informada ("+engNum(c.decl,1)+"%)"):null,
    c.desn?it("CALIBRADO","-","MURO DE ARRIMO / CONTENÇÃO EM BLOCO ESTRUTURAL OU CONCRETO ARMADO","M2",c.arrimo,335,"forn","MAGN Brooklin R$ 400/m²; R2A Rua da Prata R$ 430/m²"):null,
    c.desn?it("CALIBRADO","-","FUNDAÇÃO DA EDIFICAÇÃO EM ESTACAS E BLOCOS DE COROAMENTO (TERRENO EM DESNÍVEL)","UN",c.estacas,1900,"forn","MAGN Brooklin: fundação da construção R$ 6,3 mil para 7,7 m³"):null,
    c.nCob?it("CALIBRADO","-","FUNDAÇÃO DOS PILARES DA COBERTURA DA QUADRA (ESTACAS/TUBULÕES, BLOCOS DE COROAMENTO E CHUMBADORES)","UN",c.pil,2400,"forn","RA Vila Saúde: cobertura com fundações de 2 m e blocos de coroamento"):null
  ],{so:"quando houver"});
  sec("QUADRA"+(nQ>1?"S":"")+" DE TÊNIS — "+(c.saibro?"SAIBRO":"PISO RÁPIDO")+" ("+nQ+" UN.)",true,[
    sub("DRENAGEM E BASE"),
    it("CALIBRADO","-","MURETAS PERIMETRAIS EM BLOCO ESTRUTURAL CHEIO, REQUADRADAS (CONTENÇÃO DO PISO)","M",108*nQ,72,"forn","R2A e MAGN R$ 90/m linear"),
    it("CALIBRADO","SUDECAP 19.53.01","REGULARIZAÇÃO, COMPACTAÇÃO E BASE DRENANTE (BGS/BRITA E PÓ DE PEDRA) — 18 × 36 M POR QUADRA","M2",648*nQ,30,"forn","BP R$ 44/m² (lastro de brita); Leo R$ 24/m²"),
    it("CALIBRADO","SINAPI 102704","DRENAGEM: TUBOS PEAD PERFURADOS, MANTA GEOTÊXTIL, CANALETAS COM GRELHA E CAIXAS DE INSPEÇÃO","M2",648*nQ,20,"forn","BP R$ 16/m²; Leo R$ 22/m²"),
    sub("PISO"),
    c.saibro?it("CALIBRADO","PRÓPRIO","PISO DE SAIBRO: SAIBRO GROSSO E FINO COMPACTADO, PÓ DE TELHA E LINHAS DEMARCATÓRIAS EM PVC","M2",648*nQ,45,"forn","BP R$ 13/m² (só materiais); Leo R$ 39/m²"):
      it("CALIBRADO","-","PISO RÁPIDO: BASE, CAMADA ASFÁLTICA OU DE CONCRETO, REGULARIZADOR E PINTURA ACRÍLICA ESPORTIVA COM DEMARCAÇÃO","M2",648*nQ,95,"forn","R2A Ibirapuera R$ 160/m²; RA Rua das Flechas: concreto +R$ 20,8 mil e CBUQ +R$ 60,6 mil sobre o saibro"),
    sub("FECHAMENTO"),
    it("CALIBRADO","PRÓPRIO","ALAMBRADO: ESTRUTURA TUBULAR GALVANIZADA, TELA/REDE DE PROTEÇÃO COM TRATAMENTO UV E PORTÃO","M2",300*nQ,72,"forn","RA R$ 85 a 95/m²; R2A R$ 90/m²; Sport Piso R$ 23,3 mil e Max Quadra R$ 36,5 mil por quadra"),
    sub("ACESSÓRIOS DA QUADRA"),
    it("CALIBRADO","PRÓPRIO","POSTES DE REDE EM AÇO GALVANIZADO COM CATRACA, CABO DE AÇO E ÂNCORA DA FITA CENTRAL","CJ",nQ,2500,"forn","BP R$ 1.900 (postes); Max Quadra R$ 5 mil com rede"),
    sub("SISTEMA DE ILUMINAÇÃO"),
    it("CALIBRADO","PRÓPRIO","ILUMINAÇÃO ESPORTIVA: POSTES DE 7 A 8 M, CRUZETAS, 16 REFLETORES LED 300-400 W, CABEAMENTO E QUADRO DE ACIONAMENTO","CJ",nQ,15200,"forn","BP R$ 8,1 mil (materiais); Max Quadra R$ 14,5 mil; Sport Piso R$ 19,4 mil; RA Poços R$ 28,5 mil por quadra")
  ],{quadra:true, ref:"Quadra completa nos fornecedores: mediana "+engMoeda(simMediana(SIM_REF_QUADRA))+" por quadra ("+simRefTxt(SIM_REF_QUADRA,engMoeda)+")"});
  sec("COBERTURA DE QUADRA",true,[
    c.nCob?it("CALIBRADO","SETOP","ESTRUTURA METÁLICA (PILARES, TESOURAS EM ARCO, TERÇAS E CONTRAVENTAMENTO) COM TELHA METÁLICA GALVANIZADA TRAPEZOIDAL — 18 × 36 M POR QUADRA","M2",c.cobM2,cobFinal/(1+SIM_BDI_CALIB),"forn",
      "R$ "+engNum(cobFinal,0)+"/m² final = mediana dos orçamentos de cobertura metálica ("+simRefTxt(SIM_REF_COB,function(v){ return "R$ "+engNum(v,0)+"/m²"; })+"); BP/SETOP R$ 334,15/m² sem BDI"):null,
    c.nCob?it("CALIBRADO","SETOP","CALHAS, RUFOS E CONDUTORES PLUVIAIS DA COBERTURA","M",72*c.nCob,95,"forn","SETOP R$ 89,11/m² de calha"):null
  ],{so:"quando houver"});
  if(c.inf) sec("QUADRA INFANTIL COBERTA",false,[
    it("PARÂMETRO","-","QUADRA INFANTIL COBERTA: PISO, ALAMBRADO, ILUMINAÇÃO E COBERTURA METÁLICA","VB",1,(c.infMin+c.infMax)/2,"fixo",
      "faixa de "+engMoeda(c.infMin)+" a "+engMoeda(c.infMax)+" (parâmetro); RA Vila Saúde: quadra rápida infantil R$ 39,5 mil sem cobertura; Max Quadra: mini quadra R$ 91 mil com alambrado e iluminação")
  ],{faixa:[c.infMin,c.infMax], fonte:"parametro"});
  if(c.cont) sec("REVESTIMENTOS",true,[
    sub("PLATIBANDA GLASROC"),
    it("SINAPI","-","ARMAÇÃO DO SISTEMA DE PAREDES DE CONCRETO, EXECUTADA EM PLATIBANDAS","KG",24.6,11.31,"bp"),
    it("SETOP","-","FORNECIMENTO DE ESTRUTURA METÁLICA EM PERFIL LAMINADO, INCLUSIVE FABRICAÇÃO E MONTAGEM","KG",102.25,26.52,"bp"),
    it("CPOS/CDHU","-","FECHAMENTO EM PLACA CIMENTÍCIA COM ESPESSURA DE 12MM","M2",15.73,243.58,"bp"),
    it("SETOP","-","IMPERMEABILIZAÇÃO COM ARGAMASSA POLIMÉRICA, INCLUSIVE PREPARO MANUAL","M2",15.73,24.99,"bp"),
    it("SUDECAP","-","RUFO / CONTRA-RUFO DE CHAPA GALVANIZADA Nº 24 GSG, DESENVOLVIMENTO = 25 CM","M",26.22,38.40,"bp"),
    it("SETOP","-","LIXAMENTO MECANIZADO EM PAREDE E TETO PARA REMOÇÃO DE TINTA","M2",31.46,1.40,"bp"),
    it("SUDECAP","-","APLICAÇÃO MANUAL DE FUNDO SELADOR ACRÍLICO EM PAREDES EXTERNAS","M2",15.73,3.52,"bp"),
    sub("BANHEIROS"),
    it("CALIBRADO","SINAPI AF_09/2020","REVESTIMENTO EM GRANITO ARABESCO (PISOS DOS BANHEIROS, BANCADAS E BANCOS)","M2",19,450,"forn","BP R$ 348,15/m²; R2A R$ 610 a 950/m²")
  ]);
  sec("PISOS",true,[
    sub("ÁREA DESCOBERTA"),
    it("SETOP","-","PISO CIMENTADO COM ARGAMASSA, TRAÇO 1:3 (CIMENTO E AREIA), COM ADITIVO","M2",10,55.25,"bp"),
    sub("PISOS EXTERNOS – ÁREA DE CONVIVÊNCIA, ACESSOS E ESTACIONAMENTO"),
    it("CALIBRADO","SETOP","PISO EM CONCRETO ARMADO DESEMPENADO (TELA SOLDADA E JUNTAS) — ÁREA DE CONVIVÊNCIA, RAMPAS, ACESSOS E ESTACIONAMENTO","M2",c.pisoExt,160,"forn","R2A R$ 200/m²; RA R$ 133/m²")
  ]);
  if(c.aCob>0) sec("TELHADO — ÁREA COBERTA DE CONVIVÊNCIA",true,[
    it("CALIBRADO","SETOP","ESTRUTURA METÁLICA E COBERTURA EM TELHA METÁLICA GALVANIZADA TRAPEZOIDAL","M2",c.aCob,cobFinal/(1+SIM_BDI_CALIB),"forn","mesma referência da cobertura metálica: R$ "+engNum(cobFinal,0)+"/m² final (mediana dos fornecedores); BP R$ 434/m² de telha"),
    it("CALIBRADO","-","FORRO DE GESSO ACARTONADO (DRYWALL) NA ÁREA COBERTA","M2",c.aCob,104,"forn","R2A R$ 130/m²"),
    it("SETOP","-","CALHA, RUFO/CONTRARRUFO E CHAPIM EM CHAPA GALVANIZADA, ESP. 0,65MM","M",40,80,"forn","SETOP R$ 89,11/m²; R2A R$ 100/m")
  ]);
  sec("PINTURA",true,[
    sub("PINTURA DOS MUROS - ÁREA EXTERNA"),
    it("SETOP","-","LIXAMENTO DE PINTURA DE PAREDE","M2",c.muroA,2.27,"bp"),
    it("SINAPI","-","PINTURA COM TINTA ACRÍLICA, APLICAÇÃO MANUAL, 2 DEMÃOS (MUROS)","M2",c.muroA,22.98,"bp"),
    it("SINAPI","-","PINTURA DE SÍMBOLOS E TEXTOS COM TINTA ACRÍLICA (LOGO E GRAFISMO FAST TENNIS)","M2",50,53.71,"bp"),
    c.cont?sub("PINTURA PLATIBANDA"):null,
    c.cont?it("SINAPI","-","PINTURA COM TINTA ACRÍLICA, APLICAÇÃO MANUAL, 2 DEMÃOS (PLATIBANDA)","M2",14,22.98,"bp"):null
  ]);
  sec("INSTALAÇÕES ELÉTRICAS",true,[
    it("SUDECAP","-","ELETRODUTO CORRUGADO DE PVC NORMAL, DN 25MM (3/4\")","M",20,7.57,"bp"),
    it("SUDECAP","-","ELETRODUTO CORRUGADO DE PVC REFORÇADO, DN 32MM (1\")","M",20,10.37,"bp"),
    it("SETOP","-","CAIXA DE LIGAÇÃO/PASSAGEM EM PVC RÍGIDO 4\"X2\"","UN",3,10.96,"bp"),
    it("SETOP","-","CAIXA DE LIGAÇÃO/PASSAGEM EM PVC RÍGIDO, OCTOGONAL","UN",4,12.55,"bp"),
    it("SUDECAP","-","CABO FLEXÍVEL #1,5MM2, ISOLAMENTO 750V NÃO HALOGENADO","M",300,2.25,"bp"),
    it("SUDECAP","-","CABO FLEXÍVEL #10,0MM2, ISOLAMENTO 750V NÃO HALOGENADO","M",300,10.29,"bp"),
    it("SUDECAP","-","CABO FLEXÍVEL #2,5MM2, ISOLAMENTO 750V NÃO HALOGENADO","M",300,3.44,"bp"),
    it("SINAPI","-","LUMINÁRIA LED REFLETOR RETANGULAR BIVOLT, LUZ BRANCA","UN",2,240,"bp"),
    it("CALIBRADO","-","INFRAESTRUTURA ELÉTRICA EXTERNA: PONTOS DE TOMADAS/ILUMINAÇÃO, ELETRODUTOS ENTERRADOS E CAIXAS DE PASSAGEM","PT",40,190,"forn","R2A R$ 240 por ponto (72 a 77 pontos)"),
    it("CALIBRADO","-","QUADRO DE DISTRIBUIÇÃO (QDC) COM DISJUNTORES — 24 POSIÇÕES","UND",1,1250,"forn","R2A R$ 1.560"),
    it("CALIBRADO","-","ILUMINAÇÃO EXTERNA (REFLETORES LED 150 W, ARANDELAS E PERFIS DE LED)","UND",10,160,"forn","R2A R$ 200 por ponto")
  ]);
  sec("INSTALAÇÕES HIDRÁULICAS",true,[
    it("SINAPI","-","HIDRÁULICO (CAIXA D'ÁGUA 500 L): TUBOS E CONEXÕES PVC/PPR, REGISTROS, FILTRO Y E CAIXA D'ÁGUA","VB",1,4533.83,"bp"),
    it("SETOP/SINAPI","-","GORDURA: CAIXA DE GORDURA EM CONCRETO PRÉ-MOLDADO E VÁLVULA DE RETENÇÃO","VB",1,896.03,"bp"),
    it("SINAPI","-","ESGOTO SANITÁRIO: TUBOS E CONEXÕES PVC, CAIXAS SIFONADAS, TERMINAIS DE VENTILAÇÃO E CAIXAS DE PASSAGEM","VB",1,2499.64,"bp"),
    it("SINAPI/SETOP","-","PLUVIAL: TUBOS E CONEXÕES PVC 100 MM, RALOS SIFONADOS E CAIXA DE PASSAGEM","VB",1,1382.87,"bp"),
    it("SUDECAP","-","ÁGUA FRIA: TORNEIRA DE JARDIM 3/4\"","UN",1,59.31,"bp")
  ]);
  sec("SERRALHERIA E ACESSOS",true,[
    it("CALIBRADO","-","PORTÃO DE PEDESTRE EM AÇO COM FECHADURA ELETRÔNICA E PORTEIRO (2,10 × 1,00 M)","UND",1,3200,"forn","R2A R$ 3,6 a 4 mil; RA R$ 5,4 a 6,1 mil"),
    it("CALIBRADO","-","GRADIL, GUARDA-CORPO E CORRIMÃO DE ACESSO PINTADOS (AZUL DEL REY)","M",15,280,"forn","R2A R$ 280/m (corrimão) a R$ 415/m (gradil)")
  ]);
  sec("LIMPEZA DA OBRA",true,[
    it("SETOP","-","LIMPEZA PERMANENTE E FINAL DA OBRA","M2",c.obraM2,7.58,"bp"),
    it("CALIBRADO","-","ALUGUEL DE CAÇAMBAS ESTACIONÁRIAS (ENTULHO)","UND",3+nQ,580,"forn","R2A R$ 760 por caçamba")
  ]);
  if(c.cont) sec(c.pad==="Standard"?"CONTAINER 20 PÉS":"CONTAINER 40 PÉS",false,[
    c.pad==="Standard"?it("FORNECEDOR","-","CONTAINER 1X20 PÉS FAST TENNIS (6,0 M COMP X 2,44 M LARG X 2,90 M) CUSTOMIZADO, COM REVESTIMENTO EXTERNO GLASROC E PINTURA","VB",1,c.c20,"incc","modelo da engenharia: R$ 71 mil"):
      it("FORNECEDOR","-","CONTAINER 1X40 PÉS HC FAST TENNIS (12 M COMP X 2,44 M LARG X 2,90 M) CUSTOMIZADO, COM REVESTIMENTO EXTERNO GLASROC E PINTURA","VB",1,c.c40,"incc","mediana dos fornecedores ("+simRefTxt(SIM_REF_CONT,engMoeda)+"); BP R$ 101,5 mil"),
    it("PRÓPRIO","-","FRETE DO CONTAINER","UN",1,c.frete,"fixo")
  ]);
  else sec("EDIFICAÇÃO EM ALVENARIA / STEEL FRAME ("+engNum(c.area,0)+" M²)",true,[
    it("PARÂMETRO","-","EDIFICAÇÃO COMPLETA EM ALVENARIA OU STEEL FRAME: ESTRUTURA, FECHAMENTOS, COBERTURA, ACABAMENTOS E INSTALAÇÕES INTERNAS","M2",c.area,(c.pMin+c.pMax)/2,"fixo",
      "R$ "+engNum(c.pMin,0)+" a "+engNum(c.pMax,0)+"/m² (parâmetro da base)")
  ],{faixa:[c.area*c.pMin,c.area*c.pMax], fonte:"parametro", premium:true});
  var pq=function(q){ return q*nQ; }, ps=c.saibro?nQ:0;
  sec("ACESSÓRIOS E MOBILIÁRIOS",false,[
    it("PRÓPRIO","-","INSTALAÇÃO DE PLACAS DE IDENTIFICAÇÃO PADRÃO FAST TENNIS E LETREIRO RETROILUMINADO","UN",1,7600,"fixo"),
    it("SINAPI","-","PORTÃO DE CORRER EM CHAPA TIPO PAINEL LAMBRIL QUADRADO, COM PORTA SOCIAL","M2",2.64,537.98,"fixo"),
    it("PRÓPRIO","-","PÁ DE BICO COM CABO DE MADEIRA TERMINAL D 71CM","UN",1,40,"fixo"),
    ps?it("PRÓPRIO","-","VASSOURA PARA QUADRA DE TÊNIS DE SAIBRO DE 1,5M","UN",ps,800,"fixo"):null,
    sub("MATERIAL QUADRA"),
    it("PRÓPRIO","-","SUPORTE DE RAQUETE","UN",pq(2),30,"fixo"),
    it("PRÓPRIO","-","CATADOR DE BOLINHAS","UN",4,110,"fixo"),
    it("PRÓPRIO","-","CARRINHO DE BOLINHAS (CAPACIDADE: 120 BOLAS)","UN",1,625,"fixo"),
    it("PRÓPRIO","-","BOLSA ADICIONAL PARA CESTO DE BOLA","UN",2,152,"fixo"),
    it("PRÓPRIO","-","KIT FUNCIONAL PARA QUADRA","UN",1,40,"fixo"),
    it("PRÓPRIO","-","KIT DE MARCAÇÃO E CANTOS DE QUADRAS","UN",pq(1),557.07,"fixo"),
    it("PRÓPRIO","-","RELÓGIO PAREDE LED DIGITAL GRANDE 46CM COM TERMÔMETRO","UN",1,140,"fixo"),
    it("PRÓPRIO","-","KIT ALVO HEAD - 6UN","UN",1,132,"fixo"),
    it("PRÓPRIO","-","LINHA CENTRAL DE REDE","UN",pq(1),80,"fixo"),
    it("PRÓPRIO","-","REDE DE TÊNIS PROFISSIONAL","UN",pq(1),1526,"fixo"),
    it("PRÓPRIO","-","DEBRUM DE REDE","UN",pq(1),312,"fixo"),
    sub("BOLINHAS/RAQUETES (HEAD)"),
    it("PRÓPRIO","-","BOLA HEAD STAGE 1 - VERDE (144 BOLAS)","UN",48,51.35,"fixo"),
    it("PRÓPRIO","-","BOLA AMARELA (HEAD CHAMPIONSHIP OU HEAD TEAM) - 216 BOLAS","UN",72,37,"fixo"),
    it("PRÓPRIO","-","RAQUETE TÊNIS GRAVITY JÚNIOR","UN",4,909.35,"fixo"),
    it("PRÓPRIO","-","RAQUETE BOOM OU EXTREME MP - EMPUNHADURA L3","UN",2,1429.35,"fixo"),
    it("PRÓPRIO","-","RAQUETE BOOM OU EXTREME MP LITE - EMPUNHADURA L2","UN",2,1429.35,"fixo"),
    it("PRÓPRIO","-","RAQUETE (PROFESSOR): HEAD GRAVITY MP OU HEAD EXTREME MP","UN",1,1429.35,"fixo"),
    it("PRÓPRIO","-","SET HEAD DE CORDA SONIC PRO 16 PRETA","UN",5,41.60,"fixo"),
    it("PRÓPRIO","-","OVERGRIP HEAD SUPER COMP - PRETO","UN",5,32.45,"fixo"),
    sub("UNIFORMES"),
    it("PRÓPRIO","-","CAMISA FAST TENNIS EQUIPE","UN",20,89,"fixo"),
    it("PRÓPRIO","-","BONÉS FAST TENNIS EQUIPE","UN",6,59.90,"fixo"),
    it("PRÓPRIO","-","BERMUDAS FAST TENNIS EQUIPE","UN",9,129.30,"fixo"),
    it("PRÓPRIO","-","MOLETOM FAST TENNIS EQUIPE","UN",6,151,"fixo"),
    sub("MOBILIÁRIO E EQUIPAMENTOS"),
    it("PRÓPRIO","-","MANGUEIRA JARDIM FLEXÍVEL 30M 4 CAMADAS 3/4","M",30,24,"fixo"),
    it("PRÓPRIO","-","LIXEIRA INOX COM TAMPA BASCULANTE","UN",2,342.95,"fixo"),
    it("PRÓPRIO","-","LIXEIRA COM PEDAL EM AÇO INOX","UN",1,169.10,"fixo"),
    it("PRÓPRIO","-","BANCO DE MADEIRA GARAPEIRA FSC","UN",2,2432,"fixo"),
    it("PRÓPRIO","-","NOTEBOOK","UN",1,2700,"fixo"),
    it("PRÓPRIO","-","MICRO-ONDAS 20 LITROS","UN",1,550,"fixo"),
    it("PRÓPRIO","-","SMARTPHONE","UN",1,1000,"fixo"),
    it("PRÓPRIO","-","PURIFICADOR DE ÁGUA","UN",1,1334.34,"fixo"),
    it("PRÓPRIO","-","EXPOSITOR REFRIGERADO 229 LITROS","UN",1,3655,"fixo"),
    it("PRÓPRIO","-","DISPENSADORES (SABÃO LÍQUIDO, ÁLCOOL EM GEL E PAPEL INTERFOLHADO)","CJ",1,100,"fixo"),
    it("PRÓPRIO","-","SUPORTE PARA COPOS DESCARTÁVEIS INOX","UN",1,120,"fixo"),
    it("PRÓPRIO","-","KIT DE FERRAMENTAS COM MALETA 108 PEÇAS","UN",1,640,"fixo"),
    it("PRÓPRIO","-","LIVRO CÓDIGO DE DEFESA DO CONSUMIDOR E DISPLAY DE ACRÍLICO A5","CJ",1,57,"fixo"),
    it("PRÓPRIO","-","ARMÁRIO DE APOIO EXTERNO EM MDF 65X80X210CM","UN",1,3800,"fixo"),
    sub("MATERIAL DE LIMPEZA"),
    it("PRÓPRIO","-","KIT INICIAL DE LIMPEZA E HIGIENE (ÁLCOOL GEL, PAPEL INTERFOLHADO, SABONETE, PAPEL HIGIÊNICO, VASSOURA)","CJ",1,610,"fixo"),
    sub("CFTV"),
    it("PRÓPRIO","-","PASSAGEM DOS CABOS","VB",1,300,"fixo"),
    it("PRÓPRIO","-","INSTALAÇÃO DAS CÂMERAS","VB",6,600,"fixo"),
    it("PRÓPRIO","-","AJUSTES E TESTES DE FUNCIONAMENTO","VB",1,200,"fixo")
  ]);
  sec("MÃO DE OBRA (ITENS PRÓPRIOS)",true,[
    it("SETOP","-","ELETRICISTA COM ENCARGOS COMPLEMENTARES","H",40,31.64,"bp"),
    it("SETOP","-","AJUDANTE DE ELETRICISTA COM ENCARGOS COMPLEMENTARES","H",40,25.52,"bp"),
    it("SETOP","-","PEDREIRO COM ENCARGOS COMPLEMENTARES","H",24,31.22,"bp"),
    it("SUDECAP","-","SERVENTE COM ENCARGOS","H",80,12.95,"bp"),
    it("SETOP","-","BOMBEIRO/ENCANADOR COM ENCARGOS COMPLEMENTARES","H",40,30.49,"bp")
  ]);
  return S;
}
function simCalcular(p){
  var reg=engRegiaoDaUF(p.uf), bdi=simPd("bdi_estudo",0.15);
  var fBP=corrigirValor(1,{dataBase:"2025-07", ufBase:"MG", ufObra:p.uf});
  var fFN=corrigirValor(1,{dataBase:"2026-07", ufBase:"SP", ufObra:p.uf});
  var fIncc=fatorINCC("2026-07");
  /* itens calibrados: o preço final dos fornecedores se mantém qualquer que seja o BDI adotado */
  var fat={bp:fBP, forn:fFN*(1+SIM_BDI_CALIB)/(1+bdi), incc:fIncc, fixo:1};
  var nQ=Math.max(1,p.quad), cont=p.pad!=="Premium";
  var lote=p.lote>0?p.lote:simPd("base_lote_m2",3390), pct=simLotePct(lote), aAdeq=lote*pct/100;
  var Ll=Math.sqrt(lote*1.6), Lw=Math.sqrt(lote/1.6);
  var foot=p.pad==="Standard"?15:(p.pad==="Plus"?30:0);
  var area=p.area>0?p.area:(cont?simPd("base_area_m2",113):simPd("edif_premium_area",117));
  var decl=p.desn?Math.max(0,p.decl||10):0, nCob=p.cob?nQ:0;
  var c={nQ:nQ, saibro:p.piso!=="rapido", cont:cont, pad:p.pad, inf:!!p.inf, desn:!!p.desn, decl:decl, bdi:bdi,
    lote:lote, pct:pct, aAdeq:aAdeq, muroA:Math.round((2*Ll+Lw)*2.5), area:area, foot:foot,
    aCob:cont?Math.max(0,area-foot):0, radier:cont?foot:area,
    vol:p.desn?aAdeq*(decl/100)*Math.sqrt(aAdeq)/4:0, arrimo:p.desn?(decl/100)*aAdeq/2:0, estacas:p.desn?Math.ceil(area/9):0,
    nCob:nCob, pil:10*nCob, cobM2:648*nCob,
    meses:3+0.5*(nQ-1)+(nCob?1:0)+(p.desn?0.5:0),
    cobFinal:simPd("cobertura_m2",simMediana(SIM_REF_COB)),
    c20:simPd("container_20",71000), c40:simPd("container_40",simMediana(SIM_REF_CONT)), frete:simPd("frete_container",6000),
    pMin:simPd("edif_premium_m2_min",1600), pMax:simPd("edif_premium_m2_max",2300),
    infMin:simPd("quadra_infantil_min",60000), infMax:simPd("quadra_infantil_max",100000)};
  c.obraM2=Math.max(540,Math.min(aAdeq||9e9,648*nQ+area+150));
  c.pisoExt=Math.round(c.aCob+60);
  var notas=[];
  var etapas=simCatalogo(c).map(function(s,i){
    var itens=s.itens.map(function(x){
      if(x.sub) return x;
      var u=x.v*fat[x.corr], t=x.q*u;
      return Object.assign({},x,{u:u, tot:t});
    });
    var linhas=itens.filter(function(x){ return !x.sub; });
    var tot=linhas.reduce(function(a,x){ return a+x.tot; },0);
    var r={ordem:i+1, nome:s.nome, comBdi:s.bdi, itens:itens, ref:s.ref||"", so:s.so, premium:!!s.premium,
      fonte:s.fonte||(linhas.some(function(x){ return x.corr==="forn"||x.corr==="incc"; })?"calib":"bp")};
    r.min=r.max=tot;
    if(s.faixa){ r.min=s.faixa[0]; r.max=s.faixa[1]; }
    /* fornecedores do banco com preço por quadra na região: substituem o valor avulso da quadra, sem BDI */
    if(s.quadra){ var pqf=simPrecosForn(reg,"quadra");
      if(pqf.length){ var vq=pqf.map(function(x){ return x.v; });
        r.min=nQ*Math.min.apply(null,vq); r.max=nQ*Math.max.apply(null,vq); r.comBdi=false; r.fonte="fornecedor";
        r.ref="Valor por quadra dos fornecedores do "+reg+" no banco ("+pqf.map(function(x){ return txt(x.f.empresa)+": "+engMoeda(x.v); }).join("; ")+") × "+nQ+" quadra(s), sem BDI";
        if(!c.saibro) notas.push("preço de quadra dos fornecedores do banco não distingue o piso"); } }
    if(s.premium){ var pf=simPrecosForn(reg,"m2");
      if(pf.length){ var vs=pf.map(function(x){ return x.v; });
        r.min=c.area*Math.min.apply(null,vs); r.max=c.area*Math.max.apply(null,vs); r.comBdi=false; r.fonte="fornecedor";
        r.ref="R$/m² civil dos fornecedores do "+reg+" ("+pf.map(function(x){ return txt(x.f.empresa)+": "+engNum(x.v,0); }).join("; ")+")"; } }
    /* itens da etapa acompanham o valor central quando ele vem de faixa/fornecedor */
    var central=(r.min+r.max)/2, k=tot?central/tot:1;
    if(Math.abs(k-1)>1e-9) r.itens=itens.map(function(x){ return x.sub?x:Object.assign({},x,{u:x.u*k, tot:x.tot*k}); });
    r.itens=r.itens.map(function(x){ return x.sub?x:Object.assign({},x,{uB:r.comBdi?x.u*(1+bdi):x.u, totB:r.comBdi?x.tot*(1+bdi):x.tot}); });
    r.bdiMin=r.comBdi?r.min*bdi:0; r.bdiMax=r.comBdi?r.max*bdi:0;
    r.finMin=r.min+r.bdiMin; r.finMax=r.max+r.bdiMax;
    return r;
  }).filter(function(r){ return !(r.so&&!r.itens.some(function(x){ return !x.sub&&x.q>0; })); });
  if(p.desn) notas.push("terreno com desnível de "+engNum(decl,1)+"%: incluídos movimentação de terra, arrimo e fundação da edificação em estacas");
  if(nCob) notas.push(nCob+" quadra(s) coberta(s): incluídas estrutura metálica, calhas e fundação dos pilares");
  var soma=function(k){ return etapas.reduce(function(s,x){ return s+x[k]; },0); };
  var R={p:p, c:c, reg:reg, bdi:bdi, fBP:fBP, fFN:fFN, fIncc:fIncc, etapas:etapas, notas:notas,
    diretoMin:soma("min"), diretoMax:soma("max"), lo:soma("finMin"), hi:soma("finMax")};
  R.central=(R.lo+R.hi)/2;
  return R;
}
function engRegiaoDaUF(uf){ return REF_MERCADO.ufRegiao[uf]||""; }
  return {calcular: simCalcular, REF: REF_MERCADO, BP_OBRA: SIM_BP_OBRA, nForn: SIM_REF_FORN.length};
})();
