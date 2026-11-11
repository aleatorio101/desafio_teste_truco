import { expect } from "@jest/globals";
import { criarJogo, executarAcao, obterVisao } from '../src/jogo.js';
export { criarJogo, executarAcao, obterVisao };
// Apenas infraestrutura de teste; nenhuma regra do jogo é implementada aqui.
export function agir(estado, acao) {
  const antes = structuredClone(estado);
  const entrada = structuredClone(acao);
  const proximo = executarAcao(estado, acao);
  expect(estado).toEqual(antes);
  expect(acao).toEqual(entrada);
  expect(proximo).not.toBe(estado);
  return proximo;
}
export function proibir(estado, acao, codigo) {
  const antes = structuredClone(estado);
  expect(() => executarAcao(estado, acao)).toThrow(expect.objectContaining({
    code: codigo
  }));
  expect(estado).toEqual(antes);
}
export function visao(estado, jogador) {
  const antes = structuredClone(estado);
  const resultado = obterVisao(estado, jogador);
  expect(estado).toEqual(antes);
  return resultado;
}
