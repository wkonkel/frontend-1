Badger.api = function() {
  console.log(arguments)
}
Badger.getAccessToken = function() {
  return '0.example';
}

Badger.accountInfo = function(callback) {
  callback({
    meta: { status: "ok" },
    data: {
      id:1,
      first_name: "Badger",
      last_name: "Demo",
      name: "Badger Demo",
      email: "support@badger.com",
      domain_credits: 4,
      invites_available: 1044,
      confirmed_email: true,
      linked_accounts: [], //[{"id":157,"person_id":1,"status":"linked","last_synced_at":null,"login":"warren.konkel","started_syncing_at":null,"next_sync_at":null,"site":"facebook"},{"id":183,"person_id":1,"status":"linked","last_synced_at":null,"login":"wkonkel","started_syncing_at":null,"next_sync_at":null,"site":"twitter"},{"id":261,"person_id":1,"status":"synced","last_synced_at":"2012-06-23T00:06:13Z","login":"wkonkel","started_syncing_at":null,"next_sync_at":"2012-06-30T00:06:13Z","site":"godaddy","domain_count":25}],"
      hide_share_messages: false
    }
  });
}

Badger.getDomains = function(callback) {
  callback({
    meta: { status:"ok" },
    data: [
      { 
        name: "example.com",
        supported_tld: true,
        permissions_for_person: ["show_private_data","modify_contacts","renew","transfer_out","change_nameservers","modify_dns"],
        name_servers: ["ns1.badger.com","ns2.badger.com"],
        registry_statuses:"clienttransferprohibited",
        current_registrar:"Badger",
        expires_at:"2013-04-10T02:48:34Z",
        locked:true,
        pending_transfer:false,
        badger_dns:true,
        badger_registration:true,
        linkable_registrar:false,
        legacy_rhinonames_domain:false,
        auto_renew:true,
        registrant_contact: {
          id:1,
          first_name:"John",
          last_name:"Doe",
          organization:null,
          address:"720 Market St., Suite 300",
          address2:null,
          city:"San Francisco",
          state:"CA",
          zip:"94102",
          country:"US",
          phone:"415-787-5050",
          email:"warren@rhinonames.com",
          fax:null
        },
        administrator_contact:null,
        technical_contact:null,
        billing_contact:null
      }      
    ]
  });
}