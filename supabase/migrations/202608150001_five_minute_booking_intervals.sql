-- Public appointments may start on any five-minute boundary. Keep the
-- database as the final authority while matching the booking UI and APIs.
do $$
declare
  v_definition text;
  v_updated text;
begin
  select pg_get_functiondef(
    'public.create_booking_internal(text,text,text,uuid,uuid,timestamptz,uuid,text)'::regprocedure
  ) into v_definition;

  v_updated := replace(
    v_definition,
    'mod(extract(minute from v_local_start)::integer, 15) <> 0',
    'mod(extract(minute from v_local_start)::integer, 5) <> 0'
  );

  if v_updated = v_definition then
    raise exception 'Expected 15-minute booking interval check was not found';
  end if;

  execute v_updated;
end;
$$;

notify pgrst, 'reload schema';
