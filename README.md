# Truco paulista em duplas — especificação por testes

## Objetivo e especificação do desafio

Truco paulista para **quatro jogadores em duas duplas**, até 12 pontos, com manilha móvel, aumentos e mãos especiais.

Entrega individual da disciplina Projeto, Implementação e Teste de Software, 2026.
Este repositório contém **somente testes JavaScript, fixtures e documentação**.
O professor poderá fornecer estes testes a uma IA para construir o jogo.
Não existe implementação, interface gráfica, mock ou solução de referência.

## Colaborador

- [aleatorio101](https://github.com/aleatorio101) — autoria individual dos testes e documentação.

## Execução

Requer Node.js 24 e npm. Usamos **Jest 30.5.2**, fixado no `package-lock.json`.
Instale as dependências de desenvolvimento antes de executar:

```sh
npm ci
npm test
```

**Situação esperada nesta entrega:** o comando termina com código diferente de zero,
com `Cannot find module` para `src/jogo.js`, porque `src/jogo.js` ainda não existe. Isso não demonstra
que os cenários passaram. Depois de implementar o contrato abaixo, o mesmo comando
deverá executar todos os casos e passar sem alterações nos testes.
Não desabilitar casos nem transformar falhas em sucesso.

## Contrato para a futura implementação

Criar `src/jogo.js` como ESM e exportar funções síncronas nomeadas:

```js
export function criarJogo(opcoes) { /* futura implementação */ }
export function executarAcao(estado, acao) { /* futura implementação */ }
export function obterVisao(estado, jogador) { /* futura implementação */ }
```

Essas assinaturas são documentação, não arquivos entregues. Estados, ações e opções
são objetos JavaScript simples, serializáveis. `criarJogo` não modifica as opções;
`executarAcao` retorna outro objeto sem modificar o estado, seus objetos internos ou a ação.
`obterVisao` não modifica o estado e retorna cópias sem referências mutáveis a ele.
Estados intermediários das fixtures podem ser passados diretamente a `executarAcao`:
eles são preparação de cenários, não uma implementação alternativa.

Coordenadas usam `linha` e `coluna`, começando em zero. Tipos errados, valores não inteiros
e objetos obrigatórios ausentes geram `TypeError`; inteiros fora do intervalo geram
`RangeError`. Violações de regra geram `Error` com a propriedade `code` indicada no teste.
Uma ação com `tipo` desconhecido gera `ACAO_DESCONHECIDA`. Ações em jogo encerrado geram
`JOGO_ENCERRADO`. A validação da fase de encerramento precede validações de jogadas.
Mensagens de erro são livres; classes e códigos são parte do contrato.


### Referência e decisões de variante

Base: [regras do MegaJogos](https://cdn.megajogos.com.br/truco-online/regras), consultadas
em 08/11/2026. O site contém descrições gerais de pedidos a qualquer momento e uma
seção específica que restringe o pedido ao turno: adotamos a seção específica.
Convenções de API abaixo completam os pontos que a página não determina.

Jogadores 0/2 são equipe 0; 1/3, equipe 1. Ordem cíclica 0→1→2→3→0.
Baralho de 40 cartas: valores `4,5,6,7,Q,J,K,A,2,3`, naipes `O,E,C,P`
(ouros, espadas, copas, paus). Exemplo: `'AP'` é ás de paus.
A sequência listada é da menor à maior força. A manilha é o próximo valor da vira,
ciclando de 3 para 4; naipes só desempatarão manilhas, na ordem O<E<C<P.
Empate de maior carta entre adversários empata a vaza; empate só entre parceiros vence
para a dupla, e o primeiro parceiro que jogou a carta máxima abre a próxima vaza.
Quem vence abre a próxima; em empate permanece o iniciador daquela vaza.

`criarJogo({baralho,placar:[0,0],maoInicial:0})`: baralho obrigatório com as 40 cartas
únicas. Receber três cartas em bloco por jogador, começando em `maoInicial` e seguindo
a ordem cíclica; carta 13 é a vira; outras 27 ficam em `baralhoRestante`.
`maoInicial` padrão 0, placar padrão `[0,0]` com inteiros 0..11.
Baralho de tamanho errado: `RangeError`; duplicadas: `CARTAS_DUPLICADAS`;
identificadores malformados: `RangeError`. O contrato não exige embaralhamento.

### Estado e ações

Estado público para transições (contém também informações privadas):
`{maos,vira,baralhoRestante,placar,turno,maoInicial,rodada,resultados,valorMao,
ultimaProposta,pedido,fase,modo,vencedor,vencedorMao}`.
`maos[jogador]` contém três posições fixas; carta usada vira `null`, sem reordenar.
`rodada:{iniciador,jogadas:[{jogador,carta,coberta}]}`. Resultados de vazas em ordem:
0/1 para equipe vencedora, `null` para empate. `ultimaProposta` é equipe ou `null`.
`pedido` é `null` ou `{equipe,valor,retomarTurno}`. Vencedores são índices de equipe.

- `{tipo:'jogar',jogador,carta:indice,coberta:false}`: índice 0..2 na própria mão.
  Consumir carta e alternar turno. Carta coberta não tem força e sua identidade é secreta
  na visão. Se todas forem cobertas, a vaza empata. Erros: `FORA_DA_VEZ`, `CARTA_USADA`.
- Ao completar quatro cartas, registrar resultado e limpar `rodada.jogadas`.
  Duas vitórias ganham a mão. Empate após vitória da primeira vaza favorece essa equipe;
  primeira empatada favorece a primeira vitória posterior. Três empates não pontuam.
  Se as duas primeiras forem divididas, a terceira decide; empate favorece a primeira.
  Ao encerrar a mão: `fase:'mao_encerrada'`, `vencedorMao` equipe ou `null`, pontos
  acrescidos uma única vez; `turno` fica no iniciador da última vaza.
- `{tipo:'nova_mao',baralho}`: permitido só após `'mao_encerrada'`; preserva placar,
  gira `maoInicial` em uma posição e distribui de novo; senão `FASE_INVALIDA`.
- `{tipo:'pedir',jogador,valor}`: somente no próprio turno, antes de jogar.
  Sequência 1→3→6→9→12; salto: `AUMENTO_INVALIDO`; mesma equipe que propôs por último:
  `AUMENTO_CONSECUTIVO`. Pedido suspende cartas: `PEDIDO_PENDENTE`.
- `{tipo:'responder',jogador,resposta:'aceitar'|'recusar'|'aumentar',valor?}`:
  qualquer adversário da equipe proponente responde (`RESPOSTA_PROPRIA` se proponente).
  Aceitar fixa o valor proposto e retoma o turno salvo. Recusar dá à proponente o valor
  já aceito. Aumentar aceita o pedido anterior e propõe o próximo patamar para a outra
  equipe. Sem pedido: `SEM_PEDIDO`; resposta desconhecida: `RangeError`.
- A partir de 12 pontos, `fase:'encerrado'` e `vencedor` equipe ganhadora.
  Não limitar a soma a 12: vencer uma mão de 3 com 11 pontos produz 14.

### Mão de onze e mão de ferro

Uma equipe com 11: `modo:'onze'`, `valorMao:3`, `fase:'decisao_onze'`.
`{tipo:'decidir_onze',jogador,aceitar:boolean}` só pela equipe com 11 (`DECISAO_ADVERSARIA`).
Aceitar começa; correr dá 1 ponto ao oponente e encerra a mão. Antes da decisão,
jogar gera `DECISAO_PENDENTE`. Parceiros com 11 podem ver suas cartas mutuamente.
11×11: `modo:'ferro'`, fase direta `'em_andamento'`, valor 3, cartas próprias e alheias
ocultas; jogar por índice. Carta coberta é proibida: `CARTA_COBERTA_PROIBIDA`.
Pedido de aumento em onze/ferro causa derrota automática da equipe proponente;
o adversário fica com 12 pontos e ganha a partida (não lançar erro nesse caso).
Três empates em ferro encerram sem pontos e exigem `nova_mao`.

### Visibilidade

`obterVisao(estado,jogador)` retorna exatamente `{mao,maoParceiro,quantidades,vira,
placar,turno,mesa,resultados,valorMao,pedido,fase,modo,vencedor,vencedorMao}`.
`mao` tem os três slots próprios; em ferro todos são `null`. `maoParceiro` é `null`,
exceto para a equipe com 11 em modo onze, quando é array de três slots.
`quantidades` contém cartas restantes de cada jogador. `mesa` é cópia das jogadas
da vaza atual, substituindo a carta coberta por `null`. Não retornar `maos`,
`baralhoRestante` nem outros campos com cartas privadas. Jogadores são inteiros 0..3.

Exemplo: `executarAcao(criarJogo({baralho}), {tipo:'jogar',jogador:0,carta:0,coberta:false})`.


## Funcionamento dos casos de teste

- `tests/*.test.js`: casos independentes com preparação, ação e resultados observáveis.
- `fixtures/*.json`: entradas fixas e estados intermediários explícitos.
- `tests/apoio.js`: importações, asserções e verificações de imutabilidade; não contém regras.
- As tabelas de casos têm expectativas literais. Laços apenas enumeram dados ou executam ações.
- Usamos `test` e `expect` de `@jest/globals`; não há `skip`, `todo`, rede, relógio ou aleatoriedade.
- Os prefixos dos casos identificam a regra. Leia cada nome e suas asserções para encontrar
  o comportamento exigido; os exemplos e as tabelas são parte da especificação.

O `npm test` já configura ESM para Jest no Windows e no Linux. O aviso de módulos VM
experimentais é esperado nessa configuração. Não instalar Jest globalmente.
Com a implementação presente, `npm run test:coverage` mede somente `src/**/*.js`.

## Critérios de aceitação

Uma implementação compatível preserva todos os testes, passa em `npm test`, respeita
os erros e a imutabilidade e não expõe informação escondida por `obterVisao`.
A cobertura medida é da implementação de ensaio, não de qualquer implementação futura;
a validação prática de uma reconstrução e seus limites estão em [VALIDACAO.md](VALIDACAO.md).

## Validação prática com Jest

Uma implementação de ensaio, mantida fora deste repositório, foi reconstruída a partir
da especificação e passou nos **59 testes ativos**. Os cinco defeitos artificiais
selecionados para este jogo foram detectados. Consulte [VALIDACAO.md](VALIDACAO.md).
