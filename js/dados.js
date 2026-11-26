// ---------- Dados: plantas padrão e bases de lotes ----------
// Ficam em arquivos próprios (pastas plantas e dados) e começam a baixar já, enquanto as bibliotecas carregam.
// O app usa quando chegam (js/iniciar.js). Para incluir uma planta padrão ou uma base de lotes, ponha o arquivo
// na pasta e acrescente o nome aqui, sem a extensão.
const PLANTAS_PADRAO = ['START', 'STANDARD', 'PLUS']; // plantas/<nome>.dxf
const BASES_LOTES = ['belvedere'];                    // dados/<nome>.json
function baixaArquivo(url, tipo) {
  return fetch(url).then(r => { if (!r.ok) throw new Error(r.status + ' ' + url); return tipo === 'json' ? r.json() : r.text(); });
}
// Cada item vira null se não carregar (sem internet, ou o arquivo aberto direto do disco): o app segue sem ele.
const DADOS = {
  plantas: Promise.all(PLANTAS_PADRAO.map(nome => baixaArquivo(`plantas/${nome}.dxf`, 'texto')
    .then(texto => ({nome, texto}), e => { console.error('Planta ' + nome, e); return null; }))),
  lotes: Promise.all(BASES_LOTES.map(id => baixaArquivo(`dados/${id}.json`, 'json')
    .then(d => ({id, d}), e => { console.error('Lotes ' + id, e); return null; })))
};
