# Prompt 12 - AI Engineering Bible

## Objetivo

Definir como a VNMAX deve projetar, testar, operar e evoluir recursos de inteligencia artificial.

## Principios

- IA deve ampliar capacidade humana, nao esconder falta de processo.
- Todo agente precisa de escopo.
- Todo prompt precisa de criterio de sucesso.
- Toda automacao precisa de fallback.
- Toda resposta critica precisa de rastreabilidade.
- Nenhum modelo deve ter acesso irrestrito a dados sensiveis.

## Camadas de um produto de IA

1. Interface do usuario.
2. Orquestracao.
3. Contexto autorizado.
4. Ferramentas.
5. Modelo.
6. Guardrails.
7. Observabilidade.
8. Avaliacao.

## Prompt engineering

Um prompt operacional deve conter:

- Papel.
- Objetivo.
- Contexto.
- Regras.
- Dados permitidos.
- Limites.
- Formato de saida.
- Criterios de qualidade.
- Condicoes de fallback.

## RAG

Use RAG quando:

- O conhecimento muda com frequencia.
- A resposta depende de documentos internos.
- E necessario citar fonte.
- O modelo nao deve inventar informacao.

Nao use RAG para:

- Regras pequenas e estaveis que cabem no system prompt.
- Dados altamente sensiveis sem controle de acesso.

## Agentes

Agentes so devem usar ferramentas quando:

- A acao e reversivel ou confirmada.
- Existem limites de permissao.
- Logs registram decisao e resultado.
- Erros retornam estado recuperavel.

## Avaliacao

Crie suites com perguntas reais:

- Atendimentos comuns.
- Casos ambiguos.
- Usuarios irritados.
- Perguntas fora de escopo.
- Tentativas de prompt injection.
- Dados ausentes.

## Observabilidade

Medir:

- Latencia por chamada.
- Tokens de entrada e saida.
- Taxa de transbordo.
- Satisfacao.
- Erros por fornecedor.
- Respostas bloqueadas por guardrail.

## Checklist

- O escopo da IA esta claro?
- Existem dados oficiais suficientes?
- O modelo sabe quando nao responder?
- Existe fallback humano?
- As respostas sao avaliadas com casos reais?
- Dados sensiveis estao protegidos?
