---
id: controle-inadimplencia
title: 4.2 Controle de Inadimplência e Bloqueios
---

# ⚠️ Controle de Inadimplência e Bloqueios

Para proteger a panificadora contra prejuízos em encomendas feitas sob medida com opção de pagamento no balcão, o SGEP possui um módulo dedicado de **Gestão de Inadimplência** (`/admin/inadimplencia`).

![Tela de Controle de Inadimplência](/img/telas/15-inadimplencia.png)

---

## 1. Monitoramento de Clientes com Pendências

A tela lista todos os clientes que possuem encomendas com saldo em aberto no balcão, destacando:

- **Nome, CPF, E-mail e Telefone/WhatsApp** do cliente.
- **Quantidade de Encomendas Pendentes** e **Quantidade em Atraso** (cuja data de retirada já passou sem baixa no caixa).
- **Valor Total Devido (`R$`)**.
- **Situação Cadastral:** `Regular`, `Alerta (1 Pendência)` ou `Bloqueado para Encomendas Online`.

---

## 2. Regras Automáticas de Proteção do Sistema

O SGEP aplica duas camadas automáticas de proteção quando o cliente tenta fazer uma nova encomenda online:

1. **1 Encomenda Pendente:** O sistema permite que o cliente realize o novo pedido, mas exibe um **aviso amigável no carrinho** lembrando-o de acertar a encomenda anterior no balcão.
2. **2 ou Mais Encomendas Pendentes (ou Bloqueio Manual):** O sistema **bloqueia novas encomendas online** automaticamente até que o cliente compareça à panificadora para quitar o saldo pendente.

---

## 3. Ações do Administrador na Tela de Inadimplência

Para cada cliente listado, o administrador dispõe de duas ações diretas:

- **📧 Enviar Notificação de Cobrança por E-mail:** Dispara instantaneamente um e-mail formal da *Panificadora Sabor de Mel* informando ao cliente a quantidade de encomendas em aberto e o valor total devido.
- **🔒 Bloquear / 🔓 Desbloquear Cliente:** Permite bloquear preventivamente um cliente (informando o motivo do bloqueio) ou liberar manualmente o cadastro após negociação no balcão.

