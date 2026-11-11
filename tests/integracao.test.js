import {test,expect} from '@jest/globals';
import baralho from '../fixtures/baralho_partida.json' with {type:'json'};
import {criarJogo,agir,proibir,visao} from './apoio.js';
const jogar=(jogador,carta)=>({tipo:'jogar',jogador,carta,coberta:false});
test('TR23 — partida completa desde criarJogo até vitória com doze pontos',()=>{
  let e=criarJogo({baralho});
  e=agir(e,{tipo:'pedir',jogador:0,valor:3});
  for(const [jogador,valor] of [[1,6],[2,9],[3,12]])e=agir(e,{tipo:'responder',jogador,resposta:'aumentar',valor});
  e=agir(e,{tipo:'responder',jogador:0,resposta:'aceitar'});
  for(const carta of [0,1])for(const jogador of [0,1,2,3])e=agir(e,jogar(jogador,carta));
  expect(e.placar).toEqual([12,0]);expect(e.fase).toBe('encerrado');expect(e.vencedor).toBe(0);
  expect(e.resultados).toEqual([0,0]);expect(e.maos[0]).toEqual([null,null,'4C']);
  proibir(e,{tipo:'pedir',jogador:0,valor:3},'JOGO_ENCERRADO');
});
test('TR24 — pedido fica público sem permitir modificar o estado pela visão',()=>{
  const e=agir(criarJogo({baralho}),{tipo:'pedir',jogador:0,valor:3});const v=visao(e,1);
  expect(v.pedido).toEqual({equipe:0,valor:3,retomarTurno:0});v.pedido.valor=12;
  expect(e.pedido.valor).toBe(3);expect(v.maoParceiro).toBeNull();
});
test('TR25 — mão de onze pode ser da equipe 1 e sua recusa dá ponto à equipe 0',()=>{
  const e=criarJogo({baralho,placar:[5,11]});
  expect(visao(e,1).maoParceiro).toEqual(e.maos[3]);expect(visao(e,0).maoParceiro).toBeNull();
  proibir(e,{tipo:'decidir_onze',jogador:0,aceitar:true},'DECISAO_ADVERSARIA');
  const f=agir(e,{tipo:'decidir_onze',jogador:3,aceitar:false});
  expect(f.placar).toEqual([6,11]);expect(f.vencedorMao).toBe(0);expect(f.fase).toBe('mao_encerrada');
});
test('TR26 — responder sem pedido ou resposta desconhecida não altera cartas',()=>{
  let e=criarJogo({baralho});proibir(e,{tipo:'responder',jogador:1,resposta:'aceitar'},'SEM_PEDIDO');
  e=agir(e,{tipo:'pedir',jogador:0,valor:3});
  expect(()=>agir(e,{tipo:'responder',jogador:1,resposta:'talvez'})).toThrow(RangeError);
});
test('TR27 — mão de ferro permite vencer às cegas com ações públicas',()=>{
  let e=criarJogo({baralho,placar:[11,11]});
  for(const carta of [0,1])for(const jogador of [0,1,2,3]){
    expect(visao(e,jogador).mao).toEqual([null,null,null]);e=agir(e,jogar(jogador,carta));
  }
  expect(e.placar).toEqual([14,11]);expect(e.fase).toBe('encerrado');expect(e.vencedor).toBe(0);
});
test('TR28 — três novas mãos giram iniciador e a quarta volta ao jogador zero',()=>{
  let e=criarJogo({baralho});
  for(const inicio of [0,1,2,3]){
    expect(e.maoInicial).toBe(inicio);expect(e.turno).toBe(inicio);
    const ordem=[inicio,(inicio+1)%4,(inicio+2)%4,(inicio+3)%4];
    for(const carta of [0,1])for(const jogador of ordem)e=agir(e,jogar(jogador,carta));
    expect(e.fase).toBe('mao_encerrada');e=agir(e,{tipo:'nova_mao',baralho});
  }
  expect(e.maoInicial).toBe(0);expect(e.placar).toEqual([2,2]);expect(e.resultados).toEqual([]);
});
