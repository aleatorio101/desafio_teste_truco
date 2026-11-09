import test from 'node:test';
import baralho from '../fixtures/baralho.json' with {type:'json'};
import mao from '../fixtures/mao.json' with {type:'json'};
import forca from '../fixtures/forca.json' with {type:'json'};
import encerramentos from '../fixtures/encerramentos.json' with {type:'json'};
import { assert, criarJogo, executarAcao, obterVisao, agir, proibir, visao } from './apoio.js';
const novo=(opcoes={})=>criarJogo({baralho:structuredClone(baralho),...opcoes});
const jogar=(jogador,carta=0,coberta=false)=>({tipo:'jogar',jogador,carta,coberta});
function vaza(e,ordem,indice=0) {for(const j of ordem)e=agir(e,jogar(j,indice));return e;}

test('TR01 — baralho, distribuição por blocos e vira determinística',()=>{
  const opcoes={baralho:structuredClone(baralho)};const antes=structuredClone(opcoes);
  const e=criarJogo(opcoes);assert.deepEqual(opcoes,antes);
  assert.deepEqual(e.maos,[['4O','4E','4C'],['4P','5O','5E'],['5C','5P','6O'],['6E','6C','6P']]);
  assert.equal(e.vira,'7O');assert.equal(e.baralhoRestante.length,27);
  assert.deepEqual(e.placar,[0,0]);assert.equal(e.turno,0);assert.equal(e.maoInicial,0);
  assert.deepEqual(e.rodada,{iniciador:0,jogadas:[]});assert.deepEqual(e.resultados,[]);
  assert.equal(e.valorMao,1);assert.equal(e.pedido,null);assert.equal(e.ultimaProposta,null);
  assert.equal(e.fase,'em_andamento');assert.equal(e.modo,'normal');
  assert.equal(e.vencedor,null);assert.equal(e.vencedorMao,null);
  opcoes.baralho[0]='3P';assert.equal(e.maos[0][0],'4O');
});
test('TR02 — primeiro jogador diferente altera ordem de distribuição',()=>{
  const e=novo({maoInicial:2});assert.deepEqual(e.maos[2],['4O','4E','4C']);
  assert.deepEqual(e.maos[3],['4P','5O','5E']);assert.equal(e.turno,2);
});
for(const caso of forca) test(`TR03 — ${caso.nome}`,()=>{
  const e=vaza(caso.estado,[0,1,2,3]);
  assert.deepEqual(e.resultados,[caso.vencedor===null?null:caso.vencedor%2]);
  assert.equal(e.turno,caso.vencedor===null?0:caso.vencedor);
  assert.deepEqual(e.rodada,{iniciador:caso.vencedor===null?0:caso.vencedor,jogadas:[]});
});
test('TR04 — consumir carta preserva slots e respeita turnos',()=>{
  const e=agir(mao,jogar(0));assert.deepEqual(e.maos[0],[null,'3E','4C']);
  assert.equal(e.turno,1);assert.deepEqual(e.rodada.jogadas,[{jogador:0,carta:'3O',coberta:false}]);
  proibir(e,jogar(0,1),'FORA_DA_VEZ');
  const f=vaza(mao,[0,1,2,3]);proibir(f,jogar(0,0),'CARTA_USADA');
});
test('TR05 — duas vazas vencidas pontuam uma vez e encerram mão',()=>{
  let e=vaza(mao,[0,1,2,3]);e=vaza(e,[0,1,2,3],1);
  assert.deepEqual(e.resultados,[0,0]);assert.deepEqual(e.placar,[1,0]);
  assert.equal(e.fase,'mao_encerrada');assert.equal(e.vencedorMao,0);assert.equal(e.vencedor,null);
  proibir(e,jogar(0,2),'FASE_INVALIDA');
});
for(const c of encerramentos) test(`TR06 — vazas ${JSON.stringify(c.anteriores)} e ${c.ultima} dão ${c.vencedor}`,()=>{
  const e=vaza(c.estado,[0,1,2,3],c.indice);
  assert.equal(e.fase,'mao_encerrada');assert.equal(e.vencedorMao,c.vencedor);
  assert.deepEqual(e.placar,c.vencedor===null?[0,0]:c.vencedor===0?[1,0]:[0,1]);
});
test('TR07 — carta coberta é consumida, não vence e fica secreta',()=>{
  let e=agir(mao,jogar(0,0,true));
  assert.deepEqual(visao(e,1).mesa,[{jogador:0,carta:null,coberta:true}]);
  for(const j of [1,2,3])e=agir(e,jogar(j));
  assert.deepEqual(e.resultados,[1]);assert.equal(e.turno,1);
});
test('TR08 — quatro cartas cobertas empatam',()=>{
  let e=structuredClone(mao);for(const j of [0,1,2,3])e=agir(e,jogar(j,0,true));
  assert.deepEqual(e.resultados,[null]);assert.equal(e.turno,0);
});
test('TR09 — pedir, aceitar e retomar turno sem consumir carta',()=>{
  let e=agir(mao,{tipo:'pedir',jogador:0,valor:3});
  assert.deepEqual(e.pedido,{equipe:0,valor:3,retomarTurno:0});assert.equal(e.valorMao,1);
  proibir(e,jogar(0),'PEDIDO_PENDENTE');
  proibir(e,{tipo:'responder',jogador:2,resposta:'aceitar'},'RESPOSTA_PROPRIA');
  e=agir(e,{tipo:'responder',jogador:3,resposta:'aceitar'});
  assert.equal(e.valorMao,3);assert.equal(e.pedido,null);assert.equal(e.turno,0);
  assert.equal(e.ultimaProposta,0);assert.deepEqual(e.maos,mao.maos);
});
for(const [nivel,pontos] of [[3,1],[6,3],[9,6],[12,9]]) test(`TR10 — recusar ${nivel} entrega ${pontos} pontos aceitos`,()=>{
  let e=agir(mao,{tipo:'pedir',jogador:0,valor:3});
  // Sequência fixa de contrapropostas, sem gerar expectativas a partir do jogo.
  const aumentos=[{jogador:1,valor:6},{jogador:0,valor:9},{jogador:1,valor:12}];
  for(const a of aumentos) {if(a.valor>nivel)break;e=agir(e,{tipo:'responder',resposta:'aumentar',...a});}
  const respondente=nivel===3||nivel===9?1:0;
  e=agir(e,{tipo:'responder',jogador:respondente,resposta:'recusar'});
  assert.equal(e.fase,'mao_encerrada');
  assert.deepEqual(e.placar,nivel===3||nivel===9?[pontos,0]:[0,pontos]);
});
test('TR11 — escalar 3,6,9,12 com duplas alternadas e aceitar doze',()=>{
  let e=agir(mao,{tipo:'pedir',jogador:0,valor:3});
  for(const [jogador,valor] of [[1,6],[2,9],[3,12]])e=agir(e,{tipo:'responder',jogador,resposta:'aumentar',valor});
  e=agir(e,{tipo:'responder',jogador:0,resposta:'aceitar'});
  assert.equal(e.valorMao,12);assert.equal(e.ultimaProposta,1);assert.equal(e.turno,0);
  e=vaza(e,[0,1,2,3]);e=vaza(e,[0,1,2,3],1);
  assert.equal(e.fase,'encerrado');assert.equal(e.vencedor,0);assert.deepEqual(e.placar,[12,0]);
  proibir(e,{tipo:'nova_mao',baralho},'JOGO_ENCERRADO');
});
test('TR12 — proibir saltos, pedido fora do turno e aumentos consecutivos',()=>{
  proibir(mao,{tipo:'pedir',jogador:0,valor:6},'AUMENTO_INVALIDO');
  proibir(mao,{tipo:'pedir',jogador:1,valor:3},'FORA_DA_VEZ');
  proibir(mao,{tipo:'responder',jogador:1,resposta:'aceitar'},'SEM_PEDIDO');
  let e=agir(mao,{tipo:'pedir',jogador:0,valor:3});
  proibir(e,{tipo:'responder',jogador:1,resposta:'aumentar',valor:9},'AUMENTO_INVALIDO');
  e=agir(e,{tipo:'responder',jogador:1,resposta:'aceitar'});
  proibir(e,{tipo:'pedir',jogador:0,valor:6},'AUMENTO_CONSECUTIVO');
});
test('TR13 — nova mão preserva placar e gira jogador inicial',()=>{
  let e=vaza(mao,[0,1,2,3]);e=vaza(e,[0,1,2,3],1);
  e=agir(e,{tipo:'nova_mao',baralho:structuredClone(baralho)});
  assert.deepEqual(e.placar,[1,0]);assert.equal(e.maoInicial,1);assert.equal(e.turno,1);
  assert.deepEqual(e.maos[1],['4O','4E','4C']);assert.equal(e.vira,'7O');
  assert.deepEqual(e.resultados,[]);assert.equal(e.valorMao,1);assert.equal(e.fase,'em_andamento');
  proibir(mao,{tipo:'nova_mao',baralho},'FASE_INVALIDA');
});
test('TR14 — mão de onze aguarda decisão e revela somente ao parceiro',()=>{
  const e=novo({placar:[11,3]});assert.equal(e.modo,'onze');assert.equal(e.valorMao,3);
  assert.equal(e.fase,'decisao_onze');assert.deepEqual(visao(e,0).maoParceiro,e.maos[2]);
  assert.deepEqual(visao(e,2).maoParceiro,e.maos[0]);assert.equal(visao(e,1).maoParceiro,null);
  proibir(e,jogar(0),'DECISAO_PENDENTE');
  proibir(e,{tipo:'decidir_onze',jogador:1,aceitar:true},'DECISAO_ADVERSARIA');
  const f=agir(e,{tipo:'decidir_onze',jogador:2,aceitar:true});
  assert.equal(f.fase,'em_andamento');assert.equal(f.valorMao,3);assert.equal(f.turno,0);
});
test('TR15 — correr na mão de onze entrega apenas um ponto',()=>{
  const e=agir(novo({placar:[11,3]}),{tipo:'decidir_onze',jogador:0,aceitar:false});
  assert.deepEqual(e.placar,[11,4]);assert.equal(e.fase,'mao_encerrada');assert.equal(e.vencedorMao,1);
});
test('TR16 — vencer mão de onze soma três e finaliza em 14',()=>{
  const e0={...structuredClone(mao),placar:[11,3],modo:'onze',valorMao:3};
  const e=vaza(vaza(e0,[0,1,2,3]),[0,1,2,3],1);
  assert.deepEqual(e.placar,[14,3]);assert.equal(e.fase,'encerrado');assert.equal(e.vencedor,0);
});
for(const placar of [[11,3],[3,11],[11,11]]) test(`TR17 — pedir aumento em ${placar} perde partida`,()=>{
  const e=agir(novo({placar}),{tipo:'pedir',jogador:0,valor:3});
  assert.equal(e.fase,'encerrado');assert.equal(e.vencedor,1);assert.equal(e.placar[1],12);
  proibir(e,jogar(0),'JOGO_ENCERRADO');
});
test('TR18 — mão de ferro oculta todas as cartas, inclusive próprias',()=>{
  const e=novo({placar:[11,11]});assert.equal(e.modo,'ferro');assert.equal(e.fase,'em_andamento');
  assert.equal(e.valorMao,3);
  for(const jogador of [0,1,2,3]) {
    const v=visao(e,jogador);assert.deepEqual(v.mao,[null,null,null]);assert.equal(v.maoParceiro,null);
    assert.deepEqual(v.quantidades,[3,3,3,3]);
  }
  proibir(e,jogar(0,0,true),'CARTA_COBERTA_PROIBIDA');
  const f=agir(e,jogar(0));assert.equal(f.maos[0][0],null);assert.equal(f.turno,1);
});
test('TR19 — três empates em ferro não alteram 11x11',()=>{
  const c=encerramentos.find(c=>c.vencedor===null);
  const e0={...structuredClone(c.estado),placar:[11,11],modo:'ferro',valorMao:3};
  const e=vaza(e0,[0,1,2,3],2);
  assert.deepEqual(e.placar,[11,11]);assert.equal(e.fase,'mao_encerrada');assert.equal(e.vencedor,null);
  const f=agir(e,{tipo:'nova_mao',baralho});assert.equal(f.modo,'ferro');
});
test('TR20 — visão normal não vaza baralho e retorna cópias',()=>{
  const e=structuredClone(mao);const v=visao(e,0);
  assert.deepEqual(v,{mao:mao.maos[0],maoParceiro:null,quantidades:[3,3,3,3],vira:'4O',placar:[0,0],
    turno:0,mesa:[],resultados:[],valorMao:1,pedido:null,fase:'em_andamento',modo:'normal',vencedor:null,vencedorMao:null});
  v.mao[0]='4P';v.placar[0]=12;assert.equal(e.maos[0][0],'3O');assert.deepEqual(e.placar,[0,0]);
});
test('TR21 — validar baralho e opções',()=>{
  assert.throws(()=>novo({baralho:baralho.slice(1)}),RangeError);
  const repetido=structuredClone(baralho);repetido[1]=repetido[0];
  assert.throws(()=>novo({baralho:repetido}),{code:'CARTAS_DUPLICADAS'});
  const invalido=structuredClone(baralho);invalido[0]='8P';
  assert.throws(()=>novo({baralho:invalido}),RangeError);
  assert.throws(()=>novo({baralho:'40'}),TypeError);
  assert.throws(()=>novo({maoInicial:4}),RangeError);
  assert.throws(()=>novo({placar:[12,0]}),RangeError);
});
test('TR22 — limites de índice, jogador, tipos e ação desconhecida',()=>{
  assert.throws(()=>executarAcao(mao,jogar(0,3)),RangeError);
  assert.throws(()=>executarAcao(mao,jogar(0,-1)),RangeError);
  assert.throws(()=>executarAcao(mao,jogar(0,'0')),TypeError);
  assert.throws(()=>executarAcao(mao,jogar(4,0)),RangeError);
  assert.throws(()=>obterVisao(mao,-1),RangeError);
  assert.throws(()=>obterVisao(mao,'0'),TypeError);
  proibir(mao,{tipo:'blefar'},'ACAO_DESCONHECIDA');
});
