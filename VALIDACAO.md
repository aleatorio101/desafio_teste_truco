# Validação prática — Truco paulista

Data: 11/11/2026. Node.js 24.17.0; Jest 30.5.2; ESM com módulos VM.

## Reconstrução

Uma implementação real das três funções do contrato foi escrita em uma cópia separada,
a partir do README, testes e fixtures. Ela não importa fixtures nem contém respostas
específicas para casos de teste. Nenhuma implementação é distribuída neste repositório.
O mesmo processo de autoria fez a reconstrução; não foi uma avaliação cega por outro avaliador.

- Resultado com essa implementação: **59 testes aprovados, zero falhas e zero ignorados**.
- Cobertura da implementação de ensaio: linhas 100%, funções 93.33%, ramificações 94.66%.
- Sem implementação: `npm ci` instala Jest; `npm test` falha por não encontrar `src/jogo.js`.
- Não há mocks de jogo, `skip`, `todo`, testes exclusivos ou captura de falhas para gerar aprovação.
- Somente fixtures, testes, configuração Jest, lockfile e documentação são entregues.

## Defeitos artificiais detectados

Cada alteração foi aplicada isoladamente ao código de ensaio. O Jest executou os casos
e encontrou pelo menos uma asserção falhando, sem erro de carregamento. A implementação
correta foi restaurada ao final de cada grupo.

| Identificador | Defeito introduzido | Exemplo de teste que detectou |
| --- | --- | --- |
| TR-M1 | Inverter hierarquia dos naipes de manilha | TR03 — paus vence copas espadas ouros |
| TR-M2 | Desempatar cartas comuns de adversários | TR03 — naipes nao desempatar cartas comuns |
| TR-M3 | Pontuar valor proposto na recusa | TR10 — recusar 3 entrega 1 pontos aceitos |
| TR-M4 | Expor cartas próprias na mão de ferro | TR18 — mão de ferro oculta todas as cartas, inclusive próprias |
| TR-M5 | Não punir aumento em mão especial | TR17 — pedir aumento em 11,3 perde partida |

## Como repetir

1. Executar `npm ci` com Node.js 24.
2. Implementar `src/jogo.js` respeitando as três exportações e o contrato do README.
3. Executar `npm test` e `npm run test:coverage`, sem modificar os testes.

Todos os casos estão em `tests/`. Os cenários de `integracao.test.js` usam ações públicas
para partidas ou fluxos completos, além dos cenários unitários de regras específicas.
As implementações e resultados JSON do ensaio foram preservados separadamente para revisão local.

## Limites do resultado

Estes números demonstram compatibilidade com os cenários executados. Cobertura de linhas
não comprova todas as combinações de regras, e os cinco defeitos selecionados não representam
um teste exaustivo de mutação. Não se afirma correção universal de 100% do jogo.
As variantes e escolhas explícitas do README são parte da especificação.

## Integridade dos arquivos avaliados

SHA-256 dos arquivos de especificação e execução. Este relatório não inclui seu próprio hash.

```text
c127e21fd888b821dd3b7961505a435f92696140ec84722a4e84b151dcbfa197  fixtures/baralho.json
b99f1ca7bf43634b826000f928658b077bb1cc87d9c3a983990ddf999dfb27d2  fixtures/baralho_partida.json
ef0d5083cf7a472a19f6062e8f6c666c7e390078a6fd78dfaf5e02f4e4a4c91a  fixtures/encerramentos.json
faa1df32116081ec2e93dd79839a7e889d803d05ac99a5047e1e7a47d2978261  fixtures/forca.json
b0b7898cdc07c77106d5364db8fb3bf15fe330a96b0ce0827d5976035888a9d9  fixtures/mao.json
ba2654fc62e7e62442e08ba2f87cf6ce9cfcea0abbe4926c7725f7f3b75a6ea5  jest.config.js
83660c1b8a888b58c3d32199ab28081feaf859c15bb7b02b80a1fc48b3d7b8a3  package-lock.json
4ff49b71f1ae5089c85b2cf8ff5d0300d18baf203f5092b95c9f65e172a059ab  package.json
4d931e0c49a8117ff64456825016c763a3913dd0415944e82ff11f6f520d427a  README.md
ca0931fcb5f2fc4560d8819fd2edd9f32fceb62ac8a8b47b69924679187c646c  tests/apoio.js
fbe002f4fd6f125c05235ec0ad91918e94687581ad9e87b458e98d49962afe51  tests/integracao.test.js
9c67dc3e01dfbcf6dc87ba7043f0a97658b3457d2b96233bb8a08998479aeb2b  tests/truco.test.js
```
