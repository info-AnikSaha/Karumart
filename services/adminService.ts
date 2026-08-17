import { supabase } from '@/lib/supabase';

/**
 * Logs an administrative action to the database for audit purposes.
 * @param adminId The ID of the admin performing the action.
 * @param action A description of the action (e.g., "FREEZE_SHOP", "UPDATE_PRICE").
 * @param targetId The ID of the affected entity (profile ID, product ID, etc.).
 * @param details Additional JSON-stringified details about the action.
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetId: string,
  details: string
) {
  try {
    const { error } = await supabase.from('admin_logs').insert({
      admin_id: adminId,
      action,
      target_id: targetId,
      details,
    });
    if (error) console.error('Error logging admin action:', error);
  } catch (err) {
    console.error('Failed to log admin action:', err);
  }
}
