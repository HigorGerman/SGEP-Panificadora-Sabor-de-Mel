# SGEP - Sistema de Gestão de Encomendas de Panificadora (Sabor de Mel)

⚠️ **Status: Em Desenvolvimento**  
Este projeto está em fase ativa de desenvolvimento. Funcionalidades estão sendo implementadas e testadas de forma gradual.

---

SGEP é uma solução de software projetada para modernizar e agilizar o controle de encomendas, gestão de produtos, categorias, receitas e fluxos de pagamentos para a Panificadora Sabor de Mel.

---

## 🏗️ Arquitetura do Projeto

O sistema é dividido em duas partes principais:

*   **BackEnd**: API REST desenvolvida em **C# / .NET 10.0** utilizando ADO.NET puro (com Npgsql), autenticação JWT, documentação interativa com Scalar, integração com banco de dados PostgreSQL e SDK oficial do Mercado Pago para pagamentos.
*   **FrontEnd**: Interface web interativa desenvolvida em **React / TypeScript / Node.js**.

---

## 🛠️ Configuração e Execução Local

### Pré-requisitos
*   [.NET SDK 10.0](https://dotnet.microsoft.com/download/dotnet/10.0)
*   [Node.js](https://nodejs.org/) (Versão LTS recomendada)
*   [PostgreSQL](https://www.postgresql.org/) ativo localmente

---

### 1. Configurando o BackEnd

1.  Navegue até a pasta do projeto Web API:
    ```bash
    cd BackEnd/BackEnd
    ```
2.  Restaure as dependências do .NET:
    ```bash
    dotnet restore
    ```
3.  **Banco de Dados**: Certifique-se de que a string de conexão no arquivo [appsettings.json](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/appsettings.json) reflete as configurações do seu PostgreSQL local.
4.  **Mercado Pago (Sandbox)**:
    *   Crie um arquivo chamado `appsettings.Development.json` na pasta `BackEnd/BackEnd` (se ele ainda não existir).
    *   Adicione o seu **Access Token de Testes** (Sandbox) obtido no painel de desenvolvedores do Mercado Pago:
        ```json
        {
          "MercadoPago": {
            "AccessToken": "TEST-XXXX-XXXX-XXXX"
          }
        }
        ```
    *(Nota: O arquivo `appsettings.Development.json` está listado no `.gitignore` e não será enviado ao Git, mantendo suas chaves seguras).*
5.  Execute o servidor do backend:
    ```bash
    dotnet run
    ```
6.  Acesse a documentação interativa das APIs (Scalar API Reference) pelo navegador em:
    *   `https://localhost:XXXX/scalar/v1` (o número da porta é exibido no console ao iniciar o app).

---

### 2. Configurando o FrontEnd

1.  Navegue até a pasta do frontend:
    ```bash
    cd frontend
    ```
2.  Instale as dependências do npm:
    ```bash
    npm install
    ```
3.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
4.  Acesse a aplicação no navegador em:
    *   `http://localhost:3000` (ou a porta indicada pelo terminal).

---

## 💳 Integração Mercado Pago (Sandbox)

Atualmente, o fluxo de pagamento via Pix está na primeira fase de implementação (Backend). O endpoint de testes disponível gera um QR Code Pix dinâmico conectando-se diretamente às APIs de testes do Mercado Pago:

*   **Rota**: `POST /api/pagamentos/teste-pix`
*   **Parâmetros (JSON)**:
    ```json
    {
      "valor": 10.50
    }
    ```
*   **Retorno**:
    *   `copyAndPaste`: Código Pix Copia e Cola.
    *   `qrCodeBase64`: String de imagem em base64 para renderização direta do QR Code em tags `<img>` no frontend.
    *   `paymentId`: Identificador único da transação gerada para rastreamento.
