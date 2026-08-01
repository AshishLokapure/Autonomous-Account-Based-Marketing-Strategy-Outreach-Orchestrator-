-- Prevent an account from being attached to a campaign owned by a different tenant.
alter table public.campaigns
  add constraint campaigns_id_organization_id_key unique (id, organization_id);

alter table public.accounts
  add constraint accounts_campaign_organization_fk
  foreign key (campaign_id, organization_id)
  references public.campaigns (id, organization_id)
  on delete set null;

comment on constraint accounts_campaign_organization_fk on public.accounts is
  'Enforces that an account and its optional campaign belong to the same organization.';
