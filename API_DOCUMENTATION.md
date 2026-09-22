# Documentação da API de Ingestão de Leads — Fact Flexi CRM

Esta API pública permite integrar o sistema de faturação **Fact Flexi** (ou qualquer serviço externo) com o **Amasoft CRM**, automatizando o registo e atualização de clientes e oportunidades no funil comercial.

---

## 1. Visão Geral

- **URL Base Oficial**: `https://crm.factflexi.com`
- **Formato dos Dados**: `application/json` (UTF-8)
- **Método HTTP**: `POST`
- **Rotas Disponíveis**:
  - `POST /api/v1/leads/external` (Rota principal)
  - `POST /api/webhooks/factflexi` (Alias dedicado para Webhooks)

---

## 2. Autenticação

Todas as requisições exigem autenticação via chave de API. A chave pode ser enviada através de um dos seguintes métodos:

### Método 1: Header `x-api-key` (Recomendado)
```http
x-api-key: YxzveZ3a2h175w==
```

### Método 2: Header `Authorization: Bearer`
```http
Authorization: Bearer YxzveZ3a2h175w==
```

### Método 3: Query Parameter
```http
POST https://crm.factflexi.com/api/v1/leads/external?apiKey=YxzveZ3a2h175w==
```

> **Nota de Segurança**: No servidor de produção, a chave de API é controlada pela variável de ambiente `FACTFLEXI_API_KEY`.

---

## 3. Esquema de Validação de Dados (Zod)

A API aceita os campos em português ou inglês para compatibilidade total com os modelos do Fact Flexi:

| Campo (Alias) | Tipo | Obrigatório | Descrição / Exemplo |
| :--- | :--- | :---: | :--- |
| `nome` / `title` / `empresa` / `company_name` | `string` | **Sim** | Nome da empresa ou cliente. Mínimo 1 caractere. |
| `telefone` / `phone` / `telemovel` | `string` | Não | Telefone de contacto (ex: `"923 456 789"`, `"+244 923 456 789"`). |
| `nif` / `tax_id` / `numero_contribuinte` | `string` | Não | Número de Identificação Fiscal do cliente em Angola (ex: `"5417082390"`). |
| `email` / `correio_eletronico` | `string` | Não | E-mail de contacto corporativo ou do responsável. |
| `website` / `site` / `url` | `string` | Não | Endereço do site da empresa (ex: `"https://empresa.ao"`). |
| `contacto` / `decisionMaker` / `responsavel` | `string` | Não | Nome do gestor, diretor ou pessoa de contacto. |
| `cargo` / `decisionMakerRole` | `string` | Não | Cargo do responsável (ex: `"Diretor Financeiro"`, `"Proprietário"`). |
| `endereco` / `address` / `morada` | `string` | Não | Rua ou endereço físico do cliente. |
| `bairro` / `neighborhood` | `string` | Não | Bairro ou zona comercial. |
| `cidade` / `city` / `municipio` | `string` | Não | Município/Cidade (Padrão: `"Luanda"`). |
| `provincia` / `state` | `string` | Não | Província (Padrão: `"Luanda"`). |
| `categoria` / `categoryName` / `sector` | `string` | Não | Ramo de atividade (Padrão: `"Serviços"`). |
| `valorEstimado` / `estimatedValue` / `valor` | `number \| string` | Não | Valor monetário estimado ou valor da fatura em Kwanzas (Kz). |

---

## 4. Regras de Negócio e Inteligência de Leads

1. **Deteção Inteligente de Duplicados**:
   - Se o cliente já existir (correspondência pelo nome ou número de telefone limpo), o CRM não cria um registo duplicado. Em vez disso, atualiza os dados em falta e adiciona uma nota de sincronização com o histórico do Fact Flexi (`200 OK`).
   - Se o cliente for inédito, cria um novo lead na primeira etapa do pipeline (`201 Created`).
2. **Classificação Automática de Prioridade**:
   - `hot`: Cliente com telefone válido e sem website registado.
   - `warm`: Cliente com telefone e com website.
   - `cold`: Cliente sem contacto telefónico.
3. **Etiquetagem Automática**:
   - Leads criados recebem as tags: `Fact Flexi`, a cidade informada (`Luanda`, etc.), estado do website (`Com Website` ou `Sem Website`), `Telefone Válido` e `NIF: <numero>` quando fornecido.

---

## 5. Exemplos de Requisição

### Exemplo 1: Payload Completo (Novo Cliente Fact Flexi)

```json
{
  "nome": "Sociedade Comercial Sol do Atlântico, Lda",
  "nif": "5417082390",
  "telefone": "+244 923 112 233",
  "email": "comercial@soldoatlantico.co.ao",
  "website": "https://soldoatlantico.co.ao",
  "endereco": "Avenida 4 de Fevereiro, n.º 120",
  "bairro": "Ingombota",
  "cidade": "Luanda",
  "provincia": "Luanda",
  "categoria": "Comércio e Distribuição",
  "contacto": "Dr. Manuel Domingos",
  "cargo": "Diretor Geral",
  "valorEstimado": 1500000
}
```

### Exemplo 2: Payload Mínimo

```json
{
  "nome": "Auto Mecânica Central do Cazenga",
  "telefone": "912 334 455"
}
```

---

## 6. Exemplos de Resposta

### Resposta: 201 Created (Novo Lead Criado)

```json
{
  "success": true,
  "action": "created",
  "message": "Novo lead \"Sociedade Comercial Sol do Atlântico, Lda\" cadastrado com sucesso no Amasoft CRM via Fact Flexi API.",
  "lead": {
    "id": "lead-ff-1774300000000-412",
    "title": "Sociedade Comercial Sol do Atlântico, Lda",
    "categories": ["Comércio e Distribuição"],
    "categoryName": "Comércio e Distribuição",
    "address": "Avenida 4 de Fevereiro, n.º 120",
    "neighborhood": "Ingombota",
    "street": "Avenida 4 de Fevereiro, n.º 120",
    "city": "Luanda",
    "postalCode": null,
    "state": "Luanda",
    "countryCode": "AO",
    "website": "https://soldoatlantico.co.ao",
    "phone": "+244 923 112 233",
    "phoneUnformatted": "+244923112233",
    "location": null,
    "plusCode": null,
    "status": "lead",
    "priority": "warm",
    "estimatedValue": 1500000,
    "tags": [
      "Fact Flexi",
      "Luanda",
      "Com Website",
      "Telefone Válido",
      "NIF: 5417082390"
    ],
    "notes": [
      {
        "id": "note-1774300000000",
        "content": "Lead cadastrado automaticamente via Fact Flexi API. NIF: 5417082390 | Responsável: Dr. Manuel Domingos.",
        "createdAt": "2026-09-22T20:30:00.000Z",
        "type": "general"
      }
    ],
    "lastContactDate": null,
    "nextFollowUpDate": null,
    "email": "comercial@soldoatlantico.co.ao",
    "decisionMaker": "Dr. Manuel Domingos",
    "decisionMakerRole": "Diretor Geral"
  }
}
```

### Resposta: 200 OK (Cliente Existente Atualizado)

```json
{
  "success": true,
  "action": "updated",
  "message": "Cliente \"Sociedade Comercial Sol do Atlântico, Lda\" já existia no CRM e foi atualizado com os dados da Fact Flexi.",
  "lead": {
    "id": "lead-ff-1774300000000-412",
    "title": "Sociedade Comercial Sol do Atlântico, Lda"
  }
}
```

### Resposta: 400 Bad Request (Erro de Validação Zod)

```json
{
  "success": false,
  "error": "Bad Request",
  "message": "O campo \"title\" ou \"nome\" da empresa é obrigatório.",
  "details": [
    {
      "field": "title",
      "message": "O campo \"title\" ou \"nome\" da empresa é obrigatório."
    }
  ]
}
```

### Resposta: 401 Unauthorized (Chave Inválida)

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Chave de API inválida ou não fornecida. Use o header x-api-key ou Authorization: Bearer <chave_api>"
}
```

---

## 7. Exemplos de Integração em Código

### cURL

```bash
curl -X POST https://crm.factflexi.com/api/v1/leads/external \
  -H "Content-Type: application/json" \
  -H "x-api-key: YxzveZ3a2h175w==" \
  -d '{
    "nome": "Sociedade Comercial Sol do Atlântico, Lda",
    "nif": "5417082390",
    "telefone": "+244 923 112 233",
    "email": "comercial@soldoatlantico.co.ao",
    "cidade": "Luanda",
    "contacto": "Dr. Manuel Domingos",
    "cargo": "Diretor Geral",
    "valorEstimado": 1500000
  }'
```

### JavaScript / Node.js (Fetch)

```javascript
async function sendClientToCrm(clientData) {
  const response = await fetch('https://crm.factflexi.com/api/v1/leads/external', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'YxzveZ3a2h175w=='
    },
    body: JSON.stringify({
      nome: clientData.name,
      nif: clientData.taxId,
      telefone: clientData.phone,
      email: clientData.email,
      cidade: clientData.city || 'Luanda',
      contacto: clientData.contactPerson,
      valorEstimado: clientData.totalInvoiced || 0
    })
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Erro ao sincronizar com CRM');
  }

  return result;
}
```

### PHP (cURL / Laravel HTTP)

```php
<?php

$payload = [
    'nome'          => 'Sociedade Comercial Sol do Atlântico, Lda',
    'nif'           => '5417082390',
    'telefone'      => '+244 923 112 233',
    'email'         => 'comercial@soldoatlantico.co.ao',
    'cidade'        => 'Luanda',
    'contacto'      => 'Dr. Manuel Domingos',
    'valorEstimado' => 1500000
];

$ch = curl_init('https://crm.factflexi.com/api/v1/leads/external');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-api-key: YxzveZ3a2h175w=='
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode($response, true);
// Processar $data e $httpCode (201 ou 200)
```

### Python (Requests)

```python
import requests

url = "https://crm.factflexi.com/api/v1/leads/external"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "YxzveZ3a2h175w=="
}

payload = {
    "nome": "Sociedade Comercial Sol do Atlântico, Lda",
    "nif": "5417082390",
    "telefone": "+244 923 112 233",
    "email": "comercial@soldoatlantico.co.ao",
    "cidade": "Luanda",
    "contacto": "Dr. Manuel Domingos",
    "valorEstimado": 1500000
}

response = requests.post(url, json=payload, headers=headers)
print(response.status_code, response.json())
```
