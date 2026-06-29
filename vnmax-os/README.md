# VNMAX OS v1.0

VNMAX OS e a base operacional interna da VNMAX. Ela separa identidade, estrategia, produto, UX, arquitetura, IA e marketing em documentos modulares para que qualquer nova entrega seja coerente sem misturar conteudo institucional, comercial e tecnico.

## Regra central

Todo conteudo desta pasta e conhecimento interno. Use-o para tomar decisoes de design, arquitetura, copywriting e posicionamento. Nao exponha roadmaps, processos internos, stack tecnica, modelos, chaves, fornecedores ou planos estrategicos ao usuario final, a menos que a tarefa seja explicitamente uma apresentacao institucional, documentacao tecnica ou material interno.

## Como usar

1. Comece por `INDEX.md` para localizar o documento certo.
2. Leia `00_master/01_master_foundation.md`.
3. Para pedir a uma IA que expanda a base, use `00_master/02_claude_builder_prompt.md`.
4. Para criar uma entrega especifica, escolha o prompt especializado da pasta correspondente.
5. Antes de publicar algo, rode os checklists em `08_templates/03_quality_checklists.md`.

## Estrutura

- `00_master`: fundacao, prompt mestre e protocolo de geracao.
- `01_brand`: marca, posicionamento e ecossistema.
- `02_design`: design system e UX Bible.
- `03_strategy`: roadmap 2026-2031 e apresentacao institucional.
- `04_architecture`: arquitetura de software e blueprint WhatsApp + NVIDIA.
- `05_ai`: engenharia de IA e prompts operacionais.
- `06_marketing`: posicionamento comercial e prompts de landing.
- `07_products`: portfolio, SaaS e ofertas.
- `08_templates`: ADRs, RFCs e checklists.

## Principio de separacao

- Landing page: vende valor, confianca e clareza.
- Apresentacao institucional: mostra visao, roadmap e ecossistema.
- Documentacao tecnica: registra arquitetura, decisoes e padroes.
- Prompt mestre: governa consistencia entre todos os documentos.
- Prompts especializados: geram entregas com escopo claro.
