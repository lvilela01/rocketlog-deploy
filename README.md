# RocketLog — API de Entregas

Aplicação backend para gerenciamento de entregas de encomendas, desenvolvida com Node.js, TypeScript, Express, Prisma e PostgreSQL.

## Sumário

1. [Quick Start](#quick-start)
2. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
3. [Dependências e Propósito](#dependências-e-propósito)
4. [Configurações do Projeto](#configurações-do-projeto)
5. [Modelagem do Banco de Dados](#modelagem-do-banco-de-dados)
6. [Validações e Regras de Negócio](#validações-e-regras-de-negócio)
7. [Fluxo de Desenvolvimento](#fluxo-de-desenvolvimento)
8. [Estrutura de Diretórios](#estrutura-de-diretórios)
9. [Observações e Pontos de Atenção](#observações-e-pontos-de-atenção)
10. [Próximos Passos](#próximos-passos)

---

## Quick Start

### Pré-requisitos

- Node.js v16+
- Docker e Docker Compose (para banco de dados)
- npm ou yarn

### Instalação e Execução (3 passos)

```bash
# 1. Clonar repositório e instalar dependências
npm install

# 2. Subir banco de dados PostgreSQL em container
docker-compose up -d

# 3. Gerar e aplicar migrations, depois rodar em dev
npx prisma migrate dev
npm run dev
```

Servidor estará rodando em `http://localhost:3333`

### Comandos Úteis

```bash
# Rodar aplicação em modo desenvolvimento (hot reload)
npm run dev

# Abrir interface visual do banco (Prisma Studio)
npx prisma studio

# Criar/aplicar novas migrations
npx prisma migrate dev

# Resetar banco de dados (dev only)
npx prisma migrate reset

# Rodar testes com watch
npm run test:dev
```

---

## Visão Geral da Arquitetura

RocketLog segue uma arquitetura **REST API** simples e escalável:

```
┌─────────────┐
│  Express    │  Framework HTTP
├─────────────┤
│  Routes     │  Roteamento (usuarios, sessions, entregas, logs)
├─────────────┤
│ Controllers │  Lógica de negócio + validação
├─────────────┤
│  Prisma ORM │  Abstração de dados + migrations
├─────────────┤
│ PostgreSQL  │  Persistência
└─────────────┘
```

### Componentes Principais

| Componente | Arquivo | Responsabilidade |
|---|---|---|
| **App Setup** | `src/app.ts` | Inicializa Express, middlewares e rotas |
| **Server** | `src/server.ts` | Liga aplicação à porta 3333 |
| **Rotas** | `src/routes/` | Define endpoints HTTP e seus handlers |
| **Controllers** | `src/controllers/` | Processa requests, valida entrada, orquestra ORM |
| **Middlewares** | `src/middlewares/` | Tratamento de erros e contexto |
| **Utils** | `src/utils/` | Classes/funções auxiliares (ex: AppError) |
| **Schema** | `prisma/schema.prisma` | Define models, enums e relacionamentos |

---

## Dependências e Propósito

### Dependências de Runtime (Production)

| Pacote | Versão | Propósito | First Principles |
|---|---|---|---|
| **express** | ^5.2.1 | Framework HTTP e roteamento | Abstração do protocolo HTTP em middleware/rotas, separando concerns |
| **@prisma/client** | ^7.8.0 | ORM tipado para acesso a banco | Elimina SQL manual, garante type-safety e migrations automáticas |
| **@prisma/adapter-pg** | ^7.8.0 | Adaptador PostgreSQL para Prisma | Abstração de driver, permite trocar BD com mudanças mínimas |
| **pg** | ^8.16.3 | Driver PostgreSQL nativo | Comunicação TCP com servidor PostgreSQL |
| **bcrypt** | ^6.0.0 | Hashing de senhas | Usa funções unidirecionais (irreversíveis) para guardar senhas de forma segura |
| **jsonwebtoken** | ^9.0.3 | Geração/verificação de JWT | Autenticação stateless via tokens assinados |
| **zod** | ^4.3.6 | Validação de schemas em runtime | Garante type-safety de entrada antes de processar |

### Dependências de Desenvolvimento (DevDependencies)

| Pacote | Versão | Propósito |
|---|---|---|
| **typescript** | ^6.0.3 | Tipagem estática em JavaScript |
| **tsx** | ^4.21.0 | Executor TypeScript com hot reload |
| **ts-jest** | ^29.4.9 | Suporte Jest para TypeScript |
| **jest** | ^30.3.0 | Framework de testes |
| **supertest** | ^7.2.2 | Testes de HTTP assertions |
| **@types/** | ~latest | Type definitions para express, node, bcrypt, jwt, jest, supertest |
| **prisma** | ^7.8.0 | CLI do Prisma (migrations, studio, generate) |
| **cross-env** | ^10.1.0 | Variáveis de ambiente cross-platform |

---

## Configurações do Projeto

### TypeScript (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",        // JavaScript moderno (classes, arrow functions, promises nativas)
    "lib": ["ES2023"],         // APIs JavaScript 2023 disponíveis
    "module": "node16",        // System de módulos CommonJS/ESM nativo Node v16+
    "paths": {
      "@/*": ["./src/*"]       // Alias: import from '@/controllers' em vez de '../controllers'
    },
    "strict": true,            // Todas as checagens de tipo ativadas (null checks, etc)
    "esModuleInterop": true,   // Compatibilidade entre ESM e CommonJS
    "skipLibCheck": true,      // Não checa tipos de dependências (acelera compilação)
    "forceConsistentCasingInFileNames": true  // Previne bugs em Linux/Mac
  }
}
```

**Por que essas configurações?**
- `strict: true` força declaração correta de tipos, reduzindo bugs em runtime.
- `paths` com `@/*` reduz imports relativos profundos (`../../`), melhorando legibilidade.
- `target: ES2022` oferece features modernas com boa compatibilidade Node.js.

### Express (`src/app.ts`)

```typescript
// Ordem dos middlewares importa:
// 1. Parsear JSON
app.use(express.json())
// 2. Rotas
app.use(routes)
// 3. Tratamento de erros (sempre por último)
app.use(errorHandling)
```

**First Principles:** Middlewares formam um "pipeline" — cada um processa e passa a requisição ao próximo. Ordem importa: validação antes de rotas, erros por último para capturar exceções de tudo acima.

### Docker Compose (`docker-compose.yml`)

```yaml
services:
  postgres:
    image: "bitnami/postgresql:latest"
    ports:
      - "5432:5432"  # Host:Container
    environment:
      POSTGRES_USER: postgres      # Credenciais padrão (não usar em produção!)
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: rocketlog       # Banco de dados já criado no startup
```

**First Principles:** Container roda serviço isolado; port mapping liga host ao container. Ideal para dev, replicas ambiente de produção localmente.

### Prisma (`prisma/schema.prisma`)

Veja [Modelagem do Banco de Dados](#modelagem-do-banco-de-dados) para detalhes completos.

---

## Modelagem do Banco de Dados

### Diagrama Conceitual

```
┌──────────────┐
│    users     │
├──────────────┤
│ id (UUID)    │
│ name         │
│ email        │ ← UNIQUE (recomendado adicionar no schema)
│ password     │ (hash bcrypt)
│ role         │ (enum: sale, customer)
│ created_at   │
│ updated_at   │
└──────────────┘
       │
       │ 1:N (userId FK)
       ▼
┌──────────────┐
│ deliveries   │
├──────────────┤
│ id (UUID)    │
│ user_id      │
│ description  │
│ status       │ (enum: processing, shipped, delivered)
│ created_at   │
│ updated_at   │
└──────────────┘
       │
       │ 1:N (delivery_id FK)
       ▼
┌──────────────┐
│delivery_logs │
├──────────────┤
│ id (UUID)    │
│ delivery_id  │
│ description  │
│ created_at   │
│ updated_at   │
└──────────────┘
```

### Models Prisma

#### `User`

```prisma
model User {
  id        String   @id @default(uuid())
  name      String
  email     String                         // Recomendado: adicionar @unique
  password  String                         // Armazenado como hash bcrypt
  role      UserRole @default(customer)    // enum: sale | customer
  
  deliveries Delivery[]                    // Relação 1:N
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime? @updatedAt @map("updated_at")
  
  @@map("users")
}
```

**Campos de Auditoria:**
- `createdAt`: timestamp automático de criação (não muda mais).
- `updatedAt`: timestamp de última modificação (atualizado automaticamente pelo `@updatedAt`).

#### `Delivery`

```prisma
model Delivery {
  id          String @id @default(uuid())
  userId      String @map("user_id")       // FK para User
  description String
  status      DeliveryStatus @default(processing)  // enum
  
  user User @relation(fields: [userId], references: [id])  // Relação 1:N
  logs DeliveryLogs[]                      // Relação 1:N
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime? @updatedAt @map("updated_at")
  
  @@map("delivery")  // ⚠️ Note: singular. Considere padronizar para "deliveries"
}
```

#### `DeliveryLogs`

```prisma
model DeliveryLogs {
  id          String @id @default(uuid())
  deliveryId  String @map("delivery_id")   // FK para Delivery
  description String
  
  delivery Delivery @relation(fields: [deliveryId], references: [id])
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime? @updatedAt @map("updated_at")
  
  @@map("delivery_logs")
}
```

#### Enums

```prisma
enum UserRole {
  sale      // Vendedor/Admin
  customer  // Cliente final
}

enum DeliveryStatus {
  processing  // Aguardando envio
  shipped     // Enviado
  delivered   // Entregue
}
```

### Conceitos de Relacionamento

#### Um-para-Muitos (1:N)

**Conceito:** Uma entidade A pode estar associada a muitas entidades B, mas cada B está associada a exatamente uma A.

**Exemplo no projeto:**
- **User 1:N Delivery** — Um usuário pode ter muitas entregas, mas cada entrega pertence a um único usuário.
- **Delivery 1:N DeliveryLogs** — Uma entrega pode ter muitos logs de status, mas cada log descreve uma única entrega.

**Implementação em Prisma:**
- Lado N (muitos) armazena a **chave estrangeira (FK)** — ex: `userId` em `Delivery`.
- Lado 1 (um) expõe um **array relacional** — ex: `deliveries: Delivery[]` em `User`.

```typescript
// Prisma Client:
const userWithDeliveries = await prisma.user.findUnique({
  where: { id: userId },
  include: { deliveries: true }  // Carrega todas as deliveries do usuário
})

const deliveryWithLogs = await prisma.delivery.findUnique({
  where: { id: deliveryId },
  include: { logs: true }        // Carrega todos os logs da entrega
})
```

**First Principles:** 1:N é a relação mais eficiente para BD relacional — evita duplicação de dados e mantém integridade referencial via FK.

#### Muitos-para-Muitos (N:N)

**Conceito:** Muitas entidades de A podem estar associadas a muitas entidades de B.

**Exemplo (não implementado ainda):** Se o projeto tivesse "Tags" — uma entrega poderia ter múltiplas tags, e uma tag poderia estar em múltiplas entregas.

**Implementação em Prisma:**

*Implícita (Prisma cria tabela de junção automaticamente):*
```prisma
model Delivery {
  // ...
  tags Tag[]
}

model Tag {
  // ...
  deliveries Delivery[]
}
```
Prisma cria automaticamente tabela `DeliveryToTag` (FK dupla).

*Explícita (quando precisa metadados na relação):*
```prisma
model Delivery {
  id String @id @default(uuid())
  // ...
  deliveryTags DeliveryTag[]
}

model Tag {
  id String @id @default(uuid())
  name String
  deliveryTags DeliveryTag[]
}

model DeliveryTag {
  deliveryId String
  tagId String
  addedAt DateTime @default(now())  // Metadado: quando foi adicionada
  
  delivery Delivery @relation(fields: [deliveryId], references: [id])
  tag Tag @relation(fields: [tagId], references: [id])
  
  @@id([deliveryId, tagId])  // Chave composta
}
```

**First Principles:** N:N requer tabela de junção para evitar anomalias de atualização. Use implícita para casos simples, explícita quando precisar de dados adicionais na relação.

---

## Validações e Regras de Negócio

### Validação de Entrada com Zod

**Arquivo:** `src/controllers/users-controller.ts`

```typescript
async create(request: Request, response: Response){
  // Define esquema de validação
  const bodySchema = z.object({
    name: z.string().trim().min(3),           // String, remove espaços, mínimo 3 caracteres
    email: z.email().trim(),                   // Email válido
    password: z.string().min(6).trim()         // Mínimo 6 caracteres
  })

  // Valida e extrai dados tipados (lança erro se inválido)
  const {name, email, password} = bodySchema.parse(request.body)
  // ... resto da lógica
}
```

**First Principles:** Validação em runtime garante que dados ruins não cheguem à lógica de negócio. Zod oferece type-safe validation — o TypeScript sabe que `name` é `string` após `.parse()`.

### Regra: Unicidade de Email

```typescript
const userWithSameEmail = await prisma.user.findFirst({where: {email}})

if(userWithSameEmail){
  throw new AppError("User with same email already exists!")
}
```

**First Principles:** Sempre validar restrições de negócio antes de persistir. Idealmente também adicionar `@unique` no schema Prisma para garantia ACID em nível de banco.

**Recomendação:** Adicione ao schema:
```prisma
model User {
  // ...
  email String @unique  // Banco rejeita duplicados
  // ...
}
```

### Hashing de Senha com Bcrypt

```typescript
import {hash} from 'bcrypt'

const hashedPassword = await hash(password, 8)
// 8 = salt rounds (computational cost, higher = mais seguro mas mais lento)

const user = await prisma.user.create({
  data: {
    name, email, password: hashedPassword  // Armazena hash, não plaintext
  }
})
```

**First Principles:** Senhas nunca devem ser armazenadas em texto puro. `bcrypt`:
- Usa função **unidirecional** (hash) — impossível reverter para senha original.
- Adiciona **salt** (aleatório) — 2 usuários com mesma senha geram hashes diferentes.
- **Custo computacional** (salt rounds) — cada autenticação leva tempo, dificultando ataques de força bruta.

Durante login, usar `bcrypt.compare(inputPassword, storedHash)` para validar.

### Normalização de Resposta

```typescript
// Não retornar senha no JSON de resposta
const {password: _, ...userWithoutPassword} = user
return response.status(201).json(userWithoutPassword)
```

**First Principles:** Nunca expor dados sensíveis (senhas, tokens privados) via API, mesmo hasheados. Separação de concerns: o cliente não precisa conhecer a senha, nem o hash.

---

## Tratamento de Erros

### Classe `AppError`

**Arquivo:** `src/utils/AppError.ts`

```typescript
export class AppError{
  message: string
  statusCode: number

  constructor(message: string, statusCode: number = 400){
    this.message = message
    this.statusCode = statusCode
  }
}
```

**Uso:**
```typescript
if(userWithSameEmail){
  throw new AppError("User with same email already exists!")  // 400 por padrão
}

throw new AppError("User not found!", 404)  // HTTP 404
```

### Middleware de Tratamento

**Arquivo:** `src/middlewares/error-handling.ts`

```typescript
export function errorHandling(
  error: any,
  request: Request,
  response: Response,
  next: NextFunction
) {
  // Erros conhecidos (AppError)
  if(error instanceof AppError){
    return response.status(error.statusCode).json({message: error.message})
  }

  // Erros de validação (Zod)
  if(error instanceof ZodError){
    return response.status(400).json({
      message: 'Validation error',
      issues: error.format(),  // Detalha cada campo inválido
    })
  }

  // Erros desconhecidos
  return response.status(500).json({message: error.message})
}
```

**First Principles:** Middleware de erro (sempre por último na stack Express) captura exceções não tratadas. Normaliza resposta: cliente recebe status HTTP apropriado + JSON estruturado.

---

## Fluxo de Desenvolvimento

### 1. Inicialização (Prisma + Banco)

```bash
# Inicializar Prisma (já feito neste projeto)
npx prisma init --datasource-provider postgresql

# Subir banco em Docker
docker-compose up -d

# Aplicar migrations e criar Prisma Client
npx prisma migrate dev --name <descricao>
```

### 2. Desenvolvimento

```bash
# Rodar com hot reload
npm run dev

# Em outro terminal, visualizar/inspecionar dados
npx prisma studio
```

### 3. Criar Nova Feature (ex: Endpoint de Entregas)

**Ordem recomendada:**

1. **Atualizar schema.prisma** (se precisar novos models/campos).
2. **Executar migration** → `npx prisma migrate dev --name add_delivery_fields`
3. **Criar controller** → `src/controllers/deliveries-controller.ts`
4. **Criar rotas** → `src/routes/deliveries-routes.ts`
5. **Registrar rota em** `src/routes/index.ts`
6. **Testar** → curl, Insomnia, ou testes automatizados
7. **Adicionar testes** → `src/tests/` (Jest + supertest)

### 4. Testes

```bash
# Rodar testes em watch mode
npm run test:dev

# Exemplo de teste (supertest):
import request from 'supertest'
import { app } from '@/app'

describe('POST /users', () => {
  it('should create a user', async () => {
    const response = await request(app)
      .post('/users')
      .send({name: 'John', email: 'john@test.com', password: 'senha123'})
    
    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('id')
  })
})
```

---

## Estrutura de Diretórios

```
rocketlog/
├── docker-compose.yml          # Serviços (PostgreSQL)
├── package.json                # Dependências e scripts
├── tsconfig.json               # Configuração TypeScript
├── README.md                   # Este arquivo
│
├── .env                        # Variáveis de ambiente (não comitar)
├── .env.example                # Template de .env (comitar para referência)
│
├── prisma/
│   └── schema.prisma           # Models, enums, datasource, migrations
│
└── src/
    ├── app.ts                  # Instância Express + middlewares
    ├── server.ts               # Porta + inicialização
    │
    ├── routes/
    │   ├── index.ts            # Agregador de rotas
    │   ├── users-routes.ts     # GET/POST /users
    │   ├── sessions-routes.ts  # POST /sessions (login/auth)
    │   ├── deliveries-routes.ts
    │   └── deliveries-logs-routes.ts
    │
    ├── controllers/
    │   ├── users-controller.ts
    │   ├── sessions-controller.ts
    │   ├── deliveries-controller.ts
    │   └── deliveries-logs-controller.ts
    │
    ├── middlewares/
    │   └── error-handling.ts    # Tratamento de erros global
    │
    ├── utils/
    │   └── AppError.ts         # Classe de erros customizados
    │
    ├── database/
    │   └── prisma.ts           # Instância do Prisma Client
    │
    └── tests/
        ├── users-controller.test.ts
        ├── sessions-controller.test.ts
        └── ...
```

---

## Observações e Pontos de Atenção

### 🔴 Crítico

1. **Email não está UNIQUE no schema:**
   - Atualmente: validação apenas em app logic.
   - Risco: race condition — dois requests simultâneos criam duplicados.
   - **Solução:** Adicione `@unique` em `User.email` no schema e execute migration.

2. **Tabela singular vs plural:**
   - `Delivery` está mapeada para `@@map("delivery")` (singular).
   - Convenção: `users`, `delivery_logs` estão plurais.
   - **Recomendação:** Renomear para `deliveries` por consistência.

3. **Cascades e foreign keys:**
   - Se deletar `User`, o que acontece com `deliveries`?
   - **Defina:** `@relation(..., onDelete: Cascade)` ou `Restrict` conforme regra de negócio.

### 🟡 Importante

4. **Autenticação com JWT:**
   - Dependência `jsonwebtoken` está instalada, mas não implementada ainda.
   - **Próximo passo:** Criar middleware de autenticação, gerar tokens em `/sessions`, proteger rotas.

5. **Variáveis de ambiente:**
   - `.env` não deve ser commitado (adicionar em `.gitignore`).
   - **Criar** `.env.example` com variáveis esperadas:
     ```
     DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rocketlog
     JWT_SECRET=seu-secret-aqui
     NODE_ENV=development
     ```

6. **Índices no banco:**
   - Adicionar índices para `User.email`, `Delivery.status`, `Delivery.userId` se houver muitos registros.
   - ```prisma
     model User {
       // ...
       @@index([email])
     }
     ```

### 🟢 Boas Práticas Implementadas

✅ Tipagem estrita (TypeScript strict mode)  
✅ Validação de entrada (Zod)  
✅ Hash de senha (bcrypt)  
✅ ORM moderno com migrations (Prisma)  
✅ Tratamento de erros centralizado  
✅ Path aliases para imports legíveis  
✅ Separação de concerns (routes → controllers → ORM)  
✅ Docker para ambiente consistente  

---

## Próximos Passos

### Curto Prazo (Semana 1)

- [ ] Adicionar `@unique` em `User.email` e executar migration.
- [ ] Criar middleware de autenticação com JWT.
- [ ] Implementar endpoints faltantes: `/sessions` (login), `/deliveries`, `/delivery-logs`.
- [ ] Adicionar testes para controllers.
- [ ] Criar `.env.example`.

### Médio Prazo (Semana 2–3)

- [ ] Adicionar autorização (role-based access control).
- [ ] Implementar soft deletes (deletar sem remover registro).
- [ ] Adicionar índices e otimizar queries N+1.
- [ ] Configurar CI/CD (GitHub Actions para lint, testes, migrations).
- [ ] Documentação de API (Swagger/OpenAPI).

### Longo Prazo

- [ ] Logging estruturado.
- [ ] Cache (Redis).
- [ ] Filas para operações assíncronas (Bull).
- [ ] Testes de integração com banco de testes.
- [ ] Deploy em produção (Railway, Render, etc).

---

## Glossário Técnico

| Termo | Significado |
|---|---|
| **ORM** | Object-Relational Mapping — abstração que mapeia classes/models a tabelas de banco |
| **Migration** | Versão de mudanças no schema (cria/altera/deleta tabelas) |
| **FK** | Foreign Key — chave que referencia outra tabela |
| **Salt** | Dados aleatórios adicionados ao hash, impede rainbow tables |
| **Middleware** | Função que processa requisição antes de chegar à rota |
| **Zod** | Biblioteca de validação de schemas com type inference |
| **JWT** | JSON Web Token — token assinado para autenticação stateless |
| **Type-safe** | Código que garante tipos corretos em tempo de compilação |

---

## Referências de Código

- [Express.js Docs](https://expressjs.com/)
- [Prisma ORM Docs](https://www.prisma.io/docs/)
- [Zod Validation](https://zod.dev/)
- [bcrypt NPM](https://www.npmjs.com/package/bcrypt)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## Licença

ISC

---

**Última atualização:** Maio de 2026  
**Mantido por:** Lucas Vilela
