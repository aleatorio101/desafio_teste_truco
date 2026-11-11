import { expect, test } from "@jest/globals";
import baralho from '../fixtures/baralho.json' with { type: 'json' };
import mao from '../fixtures/mao.json' with { type: 'json' };
import forca from '../fixtures/forca.json' with { type: 'json' };
import encerramentos from '../fixtures/encerramentos.json' with { type: 'json' };
import { criarJogo, executarAcao, obterVisao, agir, proibir, visao } from './apoio.js';
const novo = (opcoes = {}) => criarJogo({
  baralho: structuredClone(baralho),
  ...opcoes
});
const jogar = (jogador, carta = 0, coberta = false) => ({
  tipo: 'jogar',
  jogador,
  carta,
  coberta
});
function vaza(e, ordem, indice = 0) {
  for (const j of ordem) e = agir(e, jogar(j, indice));
  return e;
}
test('TR01 — baralho, distribuição por blocos e vira determinística', () => {
  const opcoes = {
    baralho: structuredClone(baralho)
  };
  const antes = structuredClone(opcoes);
  const e = criarJogo(opcoes);
  expect(opcoes).toEqual(antes);
  expect(e.maos).toEqual([['4O', '4E', '4C'], ['4P', '5O', '5E'], ['5C', '5P', '6O'], ['6E', '6C', '6P']]);
  expect(e.vira).toBe('7O');
  expect(e.baralhoRestante.length).toBe(27);
  expect(e.placar).toEqual([0, 0]);
  expect(e.turno).toBe(0);
  expect(e.maoInicial).toBe(0);
  expect(e.rodada).toEqual({
    iniciador: 0,
    jogadas: []
  });
  expect(e.resultados).toEqual([]);
  expect(e.valorMao).toBe(1);
  expect(e.pedido).toBe(null);
  expect(e.ultimaProposta).toBe(null);
  expect(e.fase).toBe('em_andamento');
  expect(e.modo).toBe('normal');
  expect(e.vencedor).toBe(null);
  expect(e.vencedorMao).toBe(null);
  opcoes.baralho[0] = '3P';
  expect(e.maos[0][0]).toBe('4O');
});
test('TR02 — primeiro jogador diferente altera ordem de distribuição', () => {
  const e = novo({
    maoInicial: 2
  });
  expect(e.maos[2]).toEqual(['4O', '4E', '4C']);
  expect(e.maos[3]).toEqual(['4P', '5O', '5E']);
  expect(e.turno).toBe(2);
});
for (const caso of forca) test(`TR03 — ${caso.nome}`, () => {
  const e = vaza(caso.estado, [0, 1, 2, 3]);
  expect(e.resultados).toEqual([caso.vencedor === null ? null : caso.vencedor % 2]);
  expect(e.turno).toBe(caso.vencedor === null ? 0 : caso.vencedor);
  expect(e.rodada).toEqual({
    iniciador: caso.vencedor === null ? 0 : caso.vencedor,
    jogadas: []
  });
});
test('TR04 — consumir carta preserva slots e respeita turnos', () => {
  const e = agir(mao, jogar(0));
  expect(e.maos[0]).toEqual([null, '3E', '4C']);
  expect(e.turno).toBe(1);
  expect(e.rodada.jogadas).toEqual([{
    jogador: 0,
    carta: '3O',
    coberta: false
  }]);
  proibir(e, jogar(0, 1), 'FORA_DA_VEZ');
  const f = vaza(mao, [0, 1, 2, 3]);
  proibir(f, jogar(0, 0), 'CARTA_USADA');
});
test('TR05 — duas vazas vencidas pontuam uma vez e encerram mão', () => {
  let e = vaza(mao, [0, 1, 2, 3]);
  e = vaza(e, [0, 1, 2, 3], 1);
  expect(e.resultados).toEqual([0, 0]);
  expect(e.placar).toEqual([1, 0]);
  expect(e.fase).toBe('mao_encerrada');
  expect(e.vencedorMao).toBe(0);
  expect(e.vencedor).toBe(null);
  proibir(e, jogar(0, 2), 'FASE_INVALIDA');
});
for (const c of encerramentos) test(`TR06 — vazas ${JSON.stringify(c.anteriores)} e ${c.ultima} dão ${c.vencedor}`, () => {
  const e = vaza(c.estado, [0, 1, 2, 3], c.indice);
  expect(e.fase).toBe('mao_encerrada');
  expect(e.vencedorMao).toBe(c.vencedor);
  expect(e.placar).toEqual(c.vencedor === null ? [0, 0] : c.vencedor === 0 ? [1, 0] : [0, 1]);
});
test('TR07 — carta coberta é consumida, não vence e fica secreta', () => {
  let e = agir(mao, jogar(0, 0, true));
  expect(visao(e, 1).mesa).toEqual([{
    jogador: 0,
    carta: null,
    coberta: true
  }]);
  for (const j of [1, 2, 3]) e = agir(e, jogar(j));
  expect(e.resultados).toEqual([1]);
  expect(e.turno).toBe(1);
});
test('TR08 — quatro cartas cobertas empatam', () => {
  let e = structuredClone(mao);
  for (const j of [0, 1, 2, 3]) e = agir(e, jogar(j, 0, true));
  expect(e.resultados).toEqual([null]);
  expect(e.turno).toBe(0);
});
test('TR09 — pedir, aceitar e retomar turno sem consumir carta', () => {
  let e = agir(mao, {
    tipo: 'pedir',
    jogador: 0,
    valor: 3
  });
  expect(e.pedido).toEqual({
    equipe: 0,
    valor: 3,
    retomarTurno: 0
  });
  expect(e.valorMao).toBe(1);
  proibir(e, jogar(0), 'PEDIDO_PENDENTE');
  proibir(e, {
    tipo: 'responder',
    jogador: 2,
    resposta: 'aceitar'
  }, 'RESPOSTA_PROPRIA');
  e = agir(e, {
    tipo: 'responder',
    jogador: 3,
    resposta: 'aceitar'
  });
  expect(e.valorMao).toBe(3);
  expect(e.pedido).toBe(null);
  expect(e.turno).toBe(0);
  expect(e.ultimaProposta).toBe(0);
  expect(e.maos).toEqual(mao.maos);
});
for (const [nivel, pontos] of [[3, 1], [6, 3], [9, 6], [12, 9]]) test(`TR10 — recusar ${nivel} entrega ${pontos} pontos aceitos`, () => {
  let e = agir(mao, {
    tipo: 'pedir',
    jogador: 0,
    valor: 3
  });
  // Sequência fixa de contrapropostas, sem gerar expectativas a partir do jogo.
  const aumentos = [{
    jogador: 1,
    valor: 6
  }, {
    jogador: 0,
    valor: 9
  }, {
    jogador: 1,
    valor: 12
  }];
  for (const a of aumentos) {
    if (a.valor > nivel) break;
    e = agir(e, {
      tipo: 'responder',
      resposta: 'aumentar',
      ...a
    });
  }
  const respondente = nivel === 3 || nivel === 9 ? 1 : 0;
  e = agir(e, {
    tipo: 'responder',
    jogador: respondente,
    resposta: 'recusar'
  });
  expect(e.fase).toBe('mao_encerrada');
  expect(e.placar).toEqual(nivel === 3 || nivel === 9 ? [pontos, 0] : [0, pontos]);
});
test('TR11 — escalar 3,6,9,12 com duplas alternadas e aceitar doze', () => {
  let e = agir(mao, {
    tipo: 'pedir',
    jogador: 0,
    valor: 3
  });
  for (const [jogador, valor] of [[1, 6], [2, 9], [3, 12]]) e = agir(e, {
    tipo: 'responder',
    jogador,
    resposta: 'aumentar',
    valor
  });
  e = agir(e, {
    tipo: 'responder',
    jogador: 0,
    resposta: 'aceitar'
  });
  expect(e.valorMao).toBe(12);
  expect(e.ultimaProposta).toBe(1);
  expect(e.turno).toBe(0);
  e = vaza(e, [0, 1, 2, 3]);
  e = vaza(e, [0, 1, 2, 3], 1);
  expect(e.fase).toBe('encerrado');
  expect(e.vencedor).toBe(0);
  expect(e.placar).toEqual([12, 0]);
  proibir(e, {
    tipo: 'nova_mao',
    baralho
  }, 'JOGO_ENCERRADO');
});
test('TR12 — proibir saltos, pedido fora do turno e aumentos consecutivos', () => {
  proibir(mao, {
    tipo: 'pedir',
    jogador: 0,
    valor: 6
  }, 'AUMENTO_INVALIDO');
  proibir(mao, {
    tipo: 'pedir',
    jogador: 1,
    valor: 3
  }, 'FORA_DA_VEZ');
  proibir(mao, {
    tipo: 'responder',
    jogador: 1,
    resposta: 'aceitar'
  }, 'SEM_PEDIDO');
  let e = agir(mao, {
    tipo: 'pedir',
    jogador: 0,
    valor: 3
  });
  proibir(e, {
    tipo: 'responder',
    jogador: 1,
    resposta: 'aumentar',
    valor: 9
  }, 'AUMENTO_INVALIDO');
  e = agir(e, {
    tipo: 'responder',
    jogador: 1,
    resposta: 'aceitar'
  });
  proibir(e, {
    tipo: 'pedir',
    jogador: 0,
    valor: 6
  }, 'AUMENTO_CONSECUTIVO');
});
test('TR13 — nova mão preserva placar e gira jogador inicial', () => {
  let e = vaza(mao, [0, 1, 2, 3]);
  e = vaza(e, [0, 1, 2, 3], 1);
  e = agir(e, {
    tipo: 'nova_mao',
    baralho: structuredClone(baralho)
  });
  expect(e.placar).toEqual([1, 0]);
  expect(e.maoInicial).toBe(1);
  expect(e.turno).toBe(1);
  expect(e.maos[1]).toEqual(['4O', '4E', '4C']);
  expect(e.vira).toBe('7O');
  expect(e.resultados).toEqual([]);
  expect(e.valorMao).toBe(1);
  expect(e.fase).toBe('em_andamento');
  proibir(mao, {
    tipo: 'nova_mao',
    baralho
  }, 'FASE_INVALIDA');
});
test('TR14 — mão de onze aguarda decisão e revela somente ao parceiro', () => {
  const e = novo({
    placar: [11, 3]
  });
  expect(e.modo).toBe('onze');
  expect(e.valorMao).toBe(3);
  expect(e.fase).toBe('decisao_onze');
  expect(visao(e, 0).maoParceiro).toEqual(e.maos[2]);
  expect(visao(e, 2).maoParceiro).toEqual(e.maos[0]);
  expect(visao(e, 1).maoParceiro).toBe(null);
  proibir(e, jogar(0), 'DECISAO_PENDENTE');
  proibir(e, {
    tipo: 'decidir_onze',
    jogador: 1,
    aceitar: true
  }, 'DECISAO_ADVERSARIA');
  const f = agir(e, {
    tipo: 'decidir_onze',
    jogador: 2,
    aceitar: true
  });
  expect(f.fase).toBe('em_andamento');
  expect(f.valorMao).toBe(3);
  expect(f.turno).toBe(0);
});
test('TR15 — correr na mão de onze entrega apenas um ponto', () => {
  const e = agir(novo({
    placar: [11, 3]
  }), {
    tipo: 'decidir_onze',
    jogador: 0,
    aceitar: false
  });
  expect(e.placar).toEqual([11, 4]);
  expect(e.fase).toBe('mao_encerrada');
  expect(e.vencedorMao).toBe(1);
});
test('TR16 — vencer mão de onze soma três e finaliza em 14', () => {
  const e0 = {
    ...structuredClone(mao),
    placar: [11, 3],
    modo: 'onze',
    valorMao: 3
  };
  const e = vaza(vaza(e0, [0, 1, 2, 3]), [0, 1, 2, 3], 1);
  expect(e.placar).toEqual([14, 3]);
  expect(e.fase).toBe('encerrado');
  expect(e.vencedor).toBe(0);
});
for (const placar of [[11, 3], [3, 11], [11, 11]]) test(`TR17 — pedir aumento em ${placar} perde partida`, () => {
  const e = agir(novo({
    placar
  }), {
    tipo: 'pedir',
    jogador: 0,
    valor: 3
  });
  expect(e.fase).toBe('encerrado');
  expect(e.vencedor).toBe(1);
  expect(e.placar[1]).toBe(12);
  proibir(e, jogar(0), 'JOGO_ENCERRADO');
});
test('TR18 — mão de ferro oculta todas as cartas, inclusive próprias', () => {
  const e = novo({
    placar: [11, 11]
  });
  expect(e.modo).toBe('ferro');
  expect(e.fase).toBe('em_andamento');
  expect(e.valorMao).toBe(3);
  for (const jogador of [0, 1, 2, 3]) {
    const v = visao(e, jogador);
    expect(v.mao).toEqual([null, null, null]);
    expect(v.maoParceiro).toBe(null);
    expect(v.quantidades).toEqual([3, 3, 3, 3]);
  }
  proibir(e, jogar(0, 0, true), 'CARTA_COBERTA_PROIBIDA');
  const f = agir(e, jogar(0));
  expect(f.maos[0][0]).toBe(null);
  expect(f.turno).toBe(1);
});
test('TR19 — três empates em ferro não alteram 11x11', () => {
  const c = encerramentos.find(c => c.vencedor === null);
  const e0 = {
    ...structuredClone(c.estado),
    placar: [11, 11],
    modo: 'ferro',
    valorMao: 3
  };
  const e = vaza(e0, [0, 1, 2, 3], 2);
  expect(e.placar).toEqual([11, 11]);
  expect(e.fase).toBe('mao_encerrada');
  expect(e.vencedor).toBe(null);
  const f = agir(e, {
    tipo: 'nova_mao',
    baralho
  });
  expect(f.modo).toBe('ferro');
});
test('TR20 — visão normal não vaza baralho e retorna cópias', () => {
  const e = structuredClone(mao);
  const v = visao(e, 0);
  expect(v).toEqual({
    mao: mao.maos[0],
    maoParceiro: null,
    quantidades: [3, 3, 3, 3],
    vira: '4O',
    placar: [0, 0],
    turno: 0,
    mesa: [],
    resultados: [],
    valorMao: 1,
    pedido: null,
    fase: 'em_andamento',
    modo: 'normal',
    vencedor: null,
    vencedorMao: null
  });
  v.mao[0] = '4P';
  v.placar[0] = 12;
  expect(e.maos[0][0]).toBe('3O');
  expect(e.placar).toEqual([0, 0]);
});
test('TR21 — validar baralho e opções', () => {
  expect(() => novo({
    baralho: baralho.slice(1)
  })).toThrow(RangeError);
  const repetido = structuredClone(baralho);
  repetido[1] = repetido[0];
  expect(() => novo({
    baralho: repetido
  })).toThrow(expect.objectContaining({
    code: 'CARTAS_DUPLICADAS'
  }));
  const invalido = structuredClone(baralho);
  invalido[0] = '8P';
  expect(() => novo({
    baralho: invalido
  })).toThrow(RangeError);
  expect(() => novo({
    baralho: '40'
  })).toThrow(TypeError);
  expect(() => novo({
    maoInicial: 4
  })).toThrow(RangeError);
  expect(() => novo({
    placar: [12, 0]
  })).toThrow(RangeError);
});
test('TR22 — limites de índice, jogador, tipos e ação desconhecida', () => {
  expect(() => executarAcao(mao, jogar(0, 3))).toThrow(RangeError);
  expect(() => executarAcao(mao, jogar(0, -1))).toThrow(RangeError);
  expect(() => executarAcao(mao, jogar(0, '0'))).toThrow(TypeError);
  expect(() => executarAcao(mao, jogar(4, 0))).toThrow(RangeError);
  expect(() => obterVisao(mao, -1)).toThrow(RangeError);
  expect(() => obterVisao(mao, '0')).toThrow(TypeError);
  proibir(mao, {
    tipo: 'blefar'
  }, 'ACAO_DESCONHECIDA');
});
