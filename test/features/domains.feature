Feature: Domains
  In order to view domains
  As a logged-in user
  I want to see my domains in different filter

  Background:
    Given I logged in with mock data for domains and user info with 35 domain Credits and 5 invites available

  Scenario: I should see all pending transfer domains when clicking on Transfers tab with list view
    And I follow "Transfers"
    Then I should see "TRANSFERS"
    And I should not see "mydomain0.com"
    And I should see "transfer0.com"
    And I should not see "expiresoon0.com"
    And I should see "Fri Nov 16 2012"

  Scenario: I should see all expiring soon domains when clicking on Expiring Soon tab
    And I follow "Expiring Soon"
    Then I should see "EXPIRING SOON"
    And I should not see "mydomain0.com"
    And I should not see "transfer0.com"
    And I should see "expiresoon0.com"
    And I should see "Wed Nov 30 2011"

  Scenario: I should see all domains when clicking on All Domain tab
    Then I should see "mydomain0.com"
    And I should see "transfer0.com"
    And I should see "expiresoon0.com"

  Scenario: I should see all expiring soon domains when clicking on Expiring Soon tab with grid view
    And I mock domain search result for keys:
      | key                 | com   | net   |
      | expiresoon0         | true  | false |
      | East                | true  | false |
      | EastAgileCompany    | true  | false |
      | East-Agile-Company  | true  | false |
      | AgileCompany        | true  | false |
    And I visit grid view "expiringsoon" of domains
    Then I should see "EXPIRING SOON"
    And I wait until "#grid td" is visible
    And I wait until "#suggest-grid td" is visible
    And I should see "expiresoon0" within "#grid tbody"
    And I should see "east" within "#suggest-grid tbody"
    And I should see "eastagilecompany" within "#suggest-grid tbody"
    And I should see "agilecompany" within "#suggest-grid tbody"
    And I should see "east-agile-company" within "#suggest-grid tbody"

  Scenario: I should see all domains when clicking on All Domains tab with grid view
    And I mock domain search result for keys:
      | key                 | com   | net   |
      | mydomain0           | true  | false |
      | transfer0           | true  | false |
      | expiresoon0         | true  | false |
      | East                | true  | false |
      | EastAgileCompany    | true  | false |
      | East-Agile-Company  | true  | false |
      | AgileCompany        | true  | false |
    Then I visit grid view "all" of domains
    And I wait until "#grid td" is visible
    And I wait until "#suggest-grid td" is visible
    And I should see "transfer0" within "#grid tbody"
    And I should see "expiresoon0" within "#grid tbody"
    And I should see "mydomain0" within "#grid tbody"
    And I should see "east" within "#suggest-grid tbody"
    And I should see "eastagilecompany" within "#suggest-grid tbody"
    And I should see "agilecompany" within "#suggest-grid tbody"
    And I should see "east-agile-company" within "#suggest-grid tbody"

  Scenario: I should see notification message if there is no domains when I view all domains
    And I mock getDomains with 0 normal domains, 0 in transfer domain and 0 expiring soon domains
    And I follow "All Domains"
    Then I should see "It looks like you don't have any domains registered with us yet. You should probably:"
    And I should see "Search for a new domain"
    And I should see "Transfer a domain from another registrar"
    And I should see "Then this page will be a lot more fun."

  Scenario: I should see notification message if there is no domains in transfer when I view Transfers tab
    And I mock getDomains with 1 normal domains, 0 in transfer domain and 2 expiring soon domains
    And I follow "Transfers"
    Then I should see "It looks like you don't have any domains in pending transfer."

  Scenario: I should see notification message if there is no domains expiring soon when I view Expiring Soon tab
    And I mock getDomains with 2 normal domains, 1 in transfer domain and 0 expiring soon domains
    And I follow "Expiring Soon"
    Then I should see "It looks like you don't have any domains expiring soon."

  Scenario: I should see my total active domains on sidebar and header of MY DOMAINS
    Then I should see "3 Domains" within "#user-nav"
    Then I should see "MY DOMAINS (3)" within "#content h1 span"

  Scenario: I successfully register a new domain when viewing domains in grid view
    Then I should see "3 Domains" within "#user-nav"
    And I mock domain search result for keys:
      | key                 | com   | net   |
      | mydomain0           | true  | true  |
      | transfer0           | true  | false |
      | expiresoon0         | true  | false |
    And I visit grid view "all" of domains
    And I follow "net"
    And I mock getDomainInfo api for domain with registrar name "REGISTRAR NAME"
    And I mock getDomains with 2 normal domains, 1 in transfer domain and 1 expiring soon domains
    And I mock registerDomain api
    # because Web forwarding app is added when a new domain is registered
    And I mock addRecord
    And I mock getRecords with empty records
    And I mock getDomain
    And I press "register-button"
    Then I should see "4 Domains" within "#user-nav"

  Scenario: Unregistered Domain
    And I mock getDomain for domain "unregistered-domain.com" available for register "true" and current registrar ""
    When I visit domain page for domain "unregistered-domain.com"
    Then I should see "unregistered-domain.com" within "#content h1"
    And I should see "This domain is not currently registered!"
    And I should see "Register unregistered-domain.com"

  Scenario: Registered Domain
    And I mock getDomain for domain "mydomain0.com"
    When I follow "mydomain0.com"
    Then I should see "mydomain0.com" within "#content h1"
    And I should see "This domain is active and will auto-renew for "

  Scenario: Domain registered to somebody else (on Badger or others)
    And I mock getDomain for domain "some-domain.com" with permission "" and current registrar "GoDaddy"
    When I visit domain page for domain "some-domain.com"
    Then I should see "some-domain.com" within "#content h1"
    And I should see "This domain is currently registered at GoDaddy and will expire on"
    And I should see "If this is your domain, you can transfer to Badger."

  Scenario: Domain registered on Godaddy and have linked account
    And I mock getDomain for domain "some-domain.com" with permission "linked_account" and current registrar "GoDaddy"
    When I visit domain page for domain "some-domain.com"
    Then I should see "some-domain.com" within "#content h1"
    And I should see "This domain is currently registered to your linked account on GoDaddy"

  Scenario: Domain transfer with Godaddy registrar (with privacy)
    And I mock getDomain for domain "some-domain.com" with permission "pending_transfer" and steps pending "[{ name: 'Enter auth code', value: '' }, { name: 'Disable privacy', value: '' }, { name: 'Unlock domain', value: '' }, { name: 'Approve transfer', value: '' }, { name: 'Processed', value: '' }]" and steps completed "[{ name: 'Initiate transfer', value: 'ok' }]" and steps count "6"

    When I visit domain page for domain "some-domain.com"
    Then I should see "Transfer Progress"
    And I should see "Initiate the domain transfer on Badger"
    Then I should see "Unlock domain"
    And I should see "You need to unlock this domain at"
    Then I should see "Disable privacy"
    And I should see "You need to disable privacy for this domain at "
    Then I should see "Enter auth code"
    Then I should see "Approve transfer"
    And I should see "When the other steps are completed, a transfer request will be sent to"
    Then I should see "Processed"
    And I should see "Once the transfer request is approved, we can finish setting up the domain on Badger"
    Then I should see "16%"

  Scenario: Domain transfer with other registrar than GoDaddy (without privacy)
    And I mock getDomain for domain "some-domain.com" with permission "pending_transfer" and steps pending "[{ name: 'Approve transfer', value: '' }, { name: 'Processed', value: '' }, { name: 'Unlock domain', value: '' }]" and steps completed "[{ name: 'Initiate transfer', value: 'ok' }, { name: 'Disable privacy', value: 'ok' }, { name: 'Enter auth code', value: 'ok' }]" and steps count "6"

    When I visit domain page for domain "some-domain.com"
    Then I should see "Transfer Progress"
    And I should see "Initiate the domain transfer on Badger"
    Then I should see "Unlock domain"
    And I should see "You need to unlock this domain at"
    Then I should see "Disable privacy"
    And I should see "Privacy is disabled for this domain"
    Then I should see "Enter auth code"
    Then I should see "Approve transfer"
    And I should see "When the other steps are completed, a transfer request will be sent to"
    Then I should see "Processed"
    And I should see "Once the transfer request is approved, we can finish setting up the domain on Badger"
    Then I should see "50%"

  Scenario: Domain transfer with remote unlocking
    And I mock getDomain for domain "some-domain.com" with permission "pending_transfer" and steps pending "[{ name: 'Approve transfer', value: 'pending_transfer' }, { name: 'Processed', value: '' }, { name: 'Unlock domain', value: 'pending_remote_unlock' }]" and steps completed "[{ name: 'Initiate transfer', value: 'ok' }, { name: 'Disable privacy', value: 'ok' }, { name: 'Enter auth code', value: 'ok' }]" and steps count "6"

    When I visit domain page for domain "some-domain.com"
    And I should see "This domain is currently being unlocked"

  Scenario: Domain transfer with transfer_rejected
    And I mock getDomain for domain "some-domain.com" with permission "pending_transfer" and steps pending "[{ name: 'Approve transfer', value: 'transfer_rejected' }, { name: 'Processed', value: '' }]" and steps completed "[{ name: 'Initiate transfer', value: 'ok' }, { name: 'Disable privacy', value: 'ok' }, { name: 'Enter auth code', value: 'ok' }, { name: 'Unlock domain', value: 'ok' }]" and steps count "6"

    When I visit domain page for domain "some-domain.com"
    And I should see "You attempted to transfer this domain, however, the currently owning registrar"
