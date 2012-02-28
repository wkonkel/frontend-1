Feature: Domains
  In order to view domains
  As a logged-in user
  I want to see my domains in different filter

  Background:
    Given I logged in with mock data for domains and user info with 35 domain credits and 5 invites available

  Scenario: I should see all pending transfer domains when clicking on Transfers tab with list view
    And I follow "TRANSFERS"
    Then I should see "Domain Transfers"
    And I should not see "mydomain0.com"
    And I should see "transfer0.com"
    And I should not see "expiresoon0.com"
    And I should see "Fri Nov 16 2012"

  Scenario: I should see all expiring soon domains when clicking on Expiring Soon tab
    And I follow "EXPIRING SOON"
    Then I should see "DOMAINS EXPIRING SOON"
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
    Then I should see "DOMAINS EXPIRING SOON"
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
    And I follow "TRANSFERS"
    And I follow "MY DOMAINS"
    Then I should see "It looks like you don't have any domains registered with us yet. You should probably:"
    And I should see "Search for a new domain"
    And I should see "Transfer a domain from another registrar"
    And I should see "Then this page will be a lot more fun."

  Scenario: I should see notification message if there is no domains in transfer when I view Transfers tab
    And I mock getDomains with 1 normal domains, 0 in transfer domain and 2 expiring soon domains
    And I follow "TRANSFERS"
    Then I should see "It looks like you don't have any domains in pending transfer."

  Scenario: I should see notification message if there is no domains expiring soon when I view Expiring Soon tab
    And I mock getDomains with 2 normal domains, 1 in transfer domain and 0 expiring soon domains
    And I follow "EXPIRING SOON"
    Then I should see "It looks like you don't have any domains expiring soon."

  Scenario: I should see my total active domains on sidebar and header of MY DOMAINS
    Then I should see "MY DOMAINS (3)" within "#sidebar"
    Then I should see "MY DOMAINS (3)" within "#content h1 span"

  Scenario: I successfully register a new domain when viewing domains in grid view
      Then I should see "MY DOMAINS (3)" within "#sidebar"
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
      Then I should see "MY DOMAINS (4)" within "#sidebar"

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
    And I should see "This domain is active and will auto-renew for 1 Credit on "

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

  Scenario: Domain in transfer process need to be unlocked
    And I mock getDomain for domain "some-domain.com" with permission "pending_transfer" and transfer status "needs_unlock"
    When I visit domain page for domain "some-domain.com"
    Then I should see "some-domain.com" within "#content h1"
    And I should see "This domain is currently pending transfer. To continue, please unlock this domain."
    And I should see "Retry"

  Scenario: Domain in transfer process need authcode
    And I mock getDomain for domain "some-domain.com" with permission "pending_transfer" and transfer status "needs_auth_code"
    When I visit domain page for domain "some-domain.com"
    Then I should see "some-domain.com" within "#content h1"
    And I should see "This domain is currently pending transfer. To continue, please input the authcode here."

  Scenario: Domain of GoDaddy in transfer process need to disable privacy
    And I mock getDomain for domain "some-domain.com" with permission "pending_transfer" and transfer status "needs_privacy_disabled"
    When I visit domain page for domain "some-domain.com"
    Then I should see "some-domain.com" within "#content h1"
    And I should see "This domain is currently pending transfer. To continue, please disable this domain privacy."
    And I should see "Retry"

  Scenario: Domain of in transfer process need to retry again
    And I mock getDomain for domain "some-domain.com" with permission "pending_transfer" and transfer status "needs_transfer_request"
    When I visit domain page for domain "some-domain.com"
    Then I should see "some-domain.com" within "#content h1"
    And I should see "This domain is currently pending transfer and need a transfer request."
    And I should see "Retry"

  Scenario: Domain of in transfer process need approval of current registrar
    And I mock getDomain for domain "some-domain.com" with permission "pending_transfer" and transfer status "transfer_requested"
    When I visit domain page for domain "some-domain.com"
    Then I should see "some-domain.com" within "#content h1"
    And I should see "This domain is currently pending transfer. You will need to approve this transfer manually at your current registrar. Or you can wait 5 days and the transfer will automatically go through."
    And I should see "Retry"
