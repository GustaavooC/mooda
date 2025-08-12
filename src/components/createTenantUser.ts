import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, name, tenantId } = req.body;

  try {
    // 1. Criar usuário no Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) throw authError;

    // 2. Criar perfil do usuário
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        name
      });

    if (profileError) throw profileError;

    // 3. Vincular usuário ao tenant
    const { error: tenantUserError } = await supabase
      .from('tenant_users')
      .insert({
        tenant_id: tenantId,
        user_id: authUser.user.id,
        role: 'admin',
        is_active: true
      });

    if (tenantUserError) throw tenantUserError;

    return res.status(200).json({
      success: true,
      user: authUser.user
    });

  } catch (error) {
    console.error('Error creating tenant user:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Error creating user'
    });
  }
}