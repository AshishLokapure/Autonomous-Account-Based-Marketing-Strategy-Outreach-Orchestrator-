-- A composite SET NULL action would also null accounts.organization_id, which is not permitted.
-- The original single-column FK clears campaign_id; this tenant integrity FK only validates links.
alter table public.accounts drop constraint accounts_campaign_organization_fk;

alter table public.accounts
  add constraint accounts_campaign_organization_fk
  foreign key (campaign_id, organization_id)
  references public.campaigns (id, organization_id);
