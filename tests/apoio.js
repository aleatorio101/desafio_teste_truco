import assert from 'node:assert/strict';
import { criarJogo, executarAcao, obterVisao } from '../src/jogo.js';
export { assert, criarJogo, executarAcao, obterVisao };
// Apenas infraestrutura de teste; nenhuma regra do jogo é implementada aqui.
export function agir(estado, acao) {
  const antes = structuredClone(estado);
  const entrada = structuredClone(acao);
  const proximo = executarAcao(estado, acao);
  assert.deepEqual(estado, antes, 'A ação não pode modificar o estado anterior');
  assert.deepEqual(acao, entrada, 'A ação não pode modificar sua entrada');
  assert.notStrictEqual(proximo, estado, 'Retornar um novo estado');
  return proximo;
}
export function proibir(estado, acao, codigo) {
  const antes = structuredClone(estado);
  assert.throws(() => executarAcao(estado, acao), { code: codigo });
  assert.deepEqual(estado, antes, 'Nem ações rejeitadas podem alterar o estado');
}
export function visao(estado, jogador) {
  const antes = structuredClone(estado);
  const resultado = obterVisao(estado, jogador);
  assert.deepEqual(estado, antes, 'A consulta não pode alterar o estado');
  return resultado;
}
