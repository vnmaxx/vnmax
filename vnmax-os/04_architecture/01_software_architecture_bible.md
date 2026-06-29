# Prompt 10 - Software Architecture Bible

## Objetivo

Definir os padroes de arquitetura que devem orientar produtos, sistemas e servicos da VNMAX.

## Principios

- Simplicidade antes de distribuicao.
- Modularidade antes de microsservicos.
- Observabilidade desde o inicio.
- Seguranca por padrao.
- API first quando houver integracao.
- Testabilidade como criterio de design.
- Evolucao incremental.
- Dados protegidos por fronteiras claras.

## Escolha arquitetural

### Monolito modular

Use quando:

- O produto ainda esta validando mercado.
- A equipe e pequena.
- As fronteiras de dominio ainda estao mudando.
- Ha necessidade de velocidade com controle.

### Microsservicos

Use quando:

- Existem dominios estaveis.
- Times independentes precisam deployar separadamente.
- Ha gargalos reais de escala.
- A operacao suporta observabilidade, filas, versionamento e incidentes.

### Event driven

Use quando:

- Processos precisam ser assincronos.
- Ha integracao entre dominios.
- E necessario desacoplar produtores e consumidores.
- Reprocessamento e auditoria sao relevantes.

### CQRS

Use quando:

- Leitura e escrita possuem modelos diferentes.
- Dashboards ou relatorios exigem otimizacao propria.
- O dominio tem regras de escrita complexas.

### Event sourcing

Use com cautela quando:

- Auditoria historica e essencial.
- O estado atual precisa ser reconstruido.
- O time entende os custos de complexidade.

## Padroes obrigatorios

### Camadas

- Domain: regras de negocio puras.
- Application: casos de uso.
- Infrastructure: banco, filas, APIs externas.
- Interface: HTTP, jobs, CLIs, webhooks.

### APIs

- Contratos versionados.
- Erros previsiveis.
- Idempotencia em webhooks e pagamentos.
- Rate limit em bordas publicas.
- Logs sem dados sensiveis.

### Dados

- Multi-tenancy planejada desde o inicio quando houver SaaS.
- Separacao por tenant, org ou workspace.
- Auditoria para dados criticos.
- Backups testados, nao apenas configurados.

### Autorizacao

- RBAC para permissoes por papel.
- ABAC quando regras dependerem de contexto.
- Nunca confiar em controles apenas no frontend.

### Observabilidade

- Logs estruturados.
- Traces para fluxos distribuidos.
- Metricas de latencia, erro e throughput.
- Alertas acionaveis.

### Seguranca

- Secrets fora do repositorio.
- Validacao de entrada.
- Sanitizacao de saida.
- Dependencias atualizadas.
- Menor privilegio.
- Revisao de permissoes antes de producao.

## Estrutura de repositorio recomendada

```text
apps/
  web/
  api/
services/
  whatsapp-nvidia-bot/
packages/
  config/
  ui/
  domain/
docs/
vnmax-os/
```

## Checklist

- A arquitetura atende o estagio real do produto?
- Existe caminho claro de migracao?
- Os limites de dominio estao nomeados?
- Erros, logs, metricas e testes foram planejados?
- Dados sensiveis estao protegidos?
