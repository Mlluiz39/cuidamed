# 🗄️ Estrutura do Supabase - CuidaMed

Este diretório contém toda a estrutura do banco de dados Supabase para o aplicativo CuidaMed.

## 📋 Arquivos

- **`schema.sql`** - Schema completo do banco de dados com tabelas, índices, RLS e funções
- **`seed.sql`** - Dados de exemplo para desenvolvimento e testes

## 🚀 Configuração Inicial

### 1. Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Clique em "New Project"
4. Preencha os detalhes:
   - **Name:** CuidaMed
   - **Database Password:** Anote essa senha!
   - **Region:** Escolha a mais próxima (South America - São Paulo)
5. Aguarde a criação do projeto (~2 minutos)

### 2. Obter Credenciais

1. No dashboard do projeto, vá em **Settings** (⚙️) > **API**
2. Copie as seguintes informações:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key (chave pública)

### 3. Configurar Variáveis de Ambiente

```bash
# Na raiz do projeto
cp .env.example .env.local
```

Edite `.env.local` e adicione suas credenciais:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### 4. Executar o Schema SQL

**Opção A: Via Dashboard (Recomendado)**

1. No dashboard do Supabase, vá em **SQL Editor** (ícone 📝)
2. Clique em "New Query"
3. Copie todo o conteúdo de `schema.sql`
4. Cole no editor
5. Clique em "Run" ou pressione `Ctrl+Enter`
6. Aguarde a execução (~5 segundos)

**Opção B: Via CLI do Supabase**

```bash
# Se você tiver o Supabase CLI instalado
supabase db push
```

### 5. (Opcional) Carregar Dados de Exemplo

Para popular o banco com dados de teste:

1. **IMPORTANTE:** Primeiro obtenha seu User ID:
   - Vá em **Authentication** > **Users** no dashboard
   - Se não houver usuários, crie um via "Add User"
   - Copie o `UUID` do usuário

2. Edite `seed.sql` e substitua todos os `'SEU_USER_ID_AQUI'` pelo UUID copiado

3. No SQL Editor, execute o conteúdo de `seed.sql`

### 6. Instalar Dependências no Projeto

```bash
npm install @supabase/supabase-js
```

### 7. Testar Conexão

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Se tudo estiver configurado corretamente, a aplicação deve conectar ao Supabase automaticamente!

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

#### 1. **users**
Informações adicionais dos cuidadores/usuários
- Relacionada com `auth.users` do Supabase Auth
- Campos: `id`, `name`, `email`, `phone`

#### 2. **patients**
Dados dos pacientes idosos
- Relacionada com `users` (muitos-para-um)
- Campos: `id`, `user_id`, `name`, `age`, `phone`, `avatar`, `caregiver_name`, `caregiver_phone`

#### 3. **medications**
Medicamentos dos pacientes
- Relacionada com `patients` (muitos-para-um)
- Campos: `id`, `patient_id`, `name`, `dosage`, `frequency`, `times[]`, `active`

#### 4. **medication_history**
Histórico de administração de medicamentos
- Relacionada com `patients` e `medications`
- Campos: `id`, `patient_id`, `medication_id`, `medication_name`, `scheduled_time`, `actual_time`, `status`, `date`

#### 5. **whatsapp_logs**
Logs de comunicação via WhatsApp
- Relacionada com `patients` (muitos-para-um)
- Campos: `id`, `patient_id`, `message_type`, `message`, `status`, `sent_to`, `sent_at`, `delivered_at`

### Diagrama de Relacionamentos

```
auth.users (Supabase Auth)
    ↓
users (1)
    ↓
patients (N)
    ↓ ↓ ↓
    │ │ └─→ whatsapp_logs (N)
    │ │
    │ └──→ medication_history (N)
    │         ↑
    └──→ medications (N) ──┘
```

## 🔒 Segurança (RLS)

Todas as tabelas têm **Row Level Security (RLS)** habilitado:

- ✅ Usuários só podem ver/editar seus próprios dados
- ✅ Usuários só podem acessar pacientes associados a eles
- ✅ Usuários só podem gerenciar medicamentos de seus pacientes
- ✅ Usuários só podem ver histórico de seus pacientes

## 🔧 Funções Personalizadas

### `calculate_patient_adherence(patient_uuid, days_back)`

Calcula a taxa de adesão de um paciente nos últimos N dias.

**Exemplo de uso:**
```sql
-- Taxa de adesão nos últimos 7 dias
SELECT calculate_patient_adherence('uuid-do-paciente', 7);

-- Taxa de adesão nos últimos 30 dias
SELECT calculate_patient_adherence('uuid-do-paciente', 30);
```

## 📝 Queries Úteis

### Ver todos os pacientes
```sql
SELECT * FROM public.patients;
```

### Ver medicamentos de um paciente
```sql
SELECT * FROM public.medications WHERE patient_id = 'uuid-do-paciente';
```

### Ver histórico recente (últimos 7 dias)
```sql
SELECT * FROM public.medication_history 
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC, scheduled_time DESC;
```

### Calcular taxa de adesão geral
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'taken') * 100.0 / COUNT(*) as adherence_rate
FROM public.medication_history
WHERE date >= CURRENT_DATE - INTERVAL '30 days';
```

## 🐛 Troubleshooting

### Erro: "relation does not exist"
- Certifique-se de que executou o `schema.sql` completamente
- Verifique se está no schema `public`

### Erro: "permission denied for table"
- Verifique se o RLS está configurado corretamente
- Certifique-se de que está autenticado

### Erro: "VITE_SUPABASE_URL is not defined"
- Certifique-se de ter criado o arquivo `.env.local`
- Reinicie o servidor de desenvolvimento após criar `.env.local`

## 📚 Recursos Adicionais

- [Documentação do Supabase](https://supabase.com/docs)
- [JavaScript Client Library](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [SQL Editor](https://supabase.com/docs/guides/database/sql-editor)

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs no dashboard do Supabase
2. Consulte a documentação oficial
3. Verifique se todas as variáveis de ambiente estão corretas
