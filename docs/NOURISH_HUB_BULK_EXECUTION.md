# Nourish Hub — execução em Bulk Mode

## Métrica oficial de evolução

**Baseline preservada: 48%** (avaliação estática inicial, não telemetria de produção).

A percentagem só será alterada após evidência verificável de implementação, persistência, permissões e testes. A ponderação permanece fixa:

| Área | Peso |
|---|---:|
| Marketplace e catálogo | 15% |
| Fornecedores | 15% |
| Encomendas e logística | 20% |
| Pagamentos e facturação | 15% |
| Administração | 15% |
| Segurança e dados | 10% |
| Testes, operação e lançamento | 10% |
| **Total** | **100%** |

Uma funcionalidade só é aceite quando está integrada, persiste na fonte de dados correcta, aplica autorização no servidor e passa os testes relevantes. Código submetido sem validação não aumenta automaticamente a métrica.

## Execução desta tranche

- Criado o branch `feat/nourish-hub-product-completion` a partir de `main`.
- Criados hooks de mutação persistente para produtos, fornecedores e estados de encomendas no painel administrativo.
- Ligados os formulários administrativos de produtos e fornecedores às mutações Supabase, com feedback de erro e sucesso.
- Ligadas as transições de estado de encomendas à persistência Supabase.
- Histórico de encomendas passa a carregar as respectivas linhas de `order_items`.
- Checkout tenta remover a encomenda principal se a gravação das linhas falhar, evitando registos parciais comuns.

## Ainda não validado / bloqueios

- Não foi possível validar o projecto Supabase remoto, políticas RLS, Storage, funções ou esquema activo com as credenciais disponíveis nesta sessão.
- Não foram executados build, lint, testes automatizados ou testes E2E nesta tranche.
- Upload persistente de comprovativos depende de confirmar/criar bucket e políticas Storage.
- M-Pesa real depende de credenciais do comerciante, contrato/API do agregador e endpoints de callback/webhook.
- Gestão de publicidade e definições comerciais ainda usam estado local; requerem esquema persistente e políticas próprias.
- Stock reservado/descontado, devoluções, reembolsos, reconciliação e logística ainda não estão fechados.
- Facturação fiscal necessita de dados legais confirmados da entidade emissora e validação contabilística local.

## Próximos blocos

1. Confirmar esquema, RLS e Storage Supabase; criar migrações versionadas e seguras.
2. Tornar checkout transaccional no servidor: validação de preço, stock, IVA, reserva e linhas de encomenda.
3. Implementar upload privado de comprovativos e revisão administrativa.
4. Completar aprovação e isolamento de fornecedores, permissões de administração e auditoria.
5. Persistir campanhas, taxas, configurações e relatórios.
6. Integrar pagamentos reais e notificações quando forem fornecidas credenciais e contratos.
7. Completar logística, devoluções, reconciliação e facturação.
8. Executar testes unitários, integração, E2E, segurança e verificação de produção.

**Regra de reporte:** publicar uma actualização por tranche de implementação e validação, usando sempre a mesma ponderação. Não existe monitorização automática em background neste documento.
