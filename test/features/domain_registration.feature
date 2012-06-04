Feature: Badger Registration
  In order to view my domain registration information
  As a logged-in user
  I want to view and edit my domain registration information

  Background:
    Given I logged in with mock data for domains and user info with 35 domain credits and 5 invites available

  Scenario: When I visit Registration I should see information (current registration, whois) of my domain
    And I mock getDomain for domain "mydomain0.com" with permission "renew,transfer_out"
    When I visit Registration for domain "mydomain0.com"
    Then I should see "Registration" within "#content h1"
    And I should see "Current Registration"
    And I should see "Badger until "
    And I should see "Created"
    And I should see "Through"
    And I should see "Previously"
    And I should see "Public Whois Listing"
    And I should see "Change Contacts"
    And I should see "Registrant"
    And I should see "Administrator"
    And I should see "Billing"
    And I should see "Technical"
    And I should see "Keep contact information private"
    And I should see "Want to transfer this domain to another registrar?"

  Scenario: If my domain is locked I can unlock my domain
    And I mock getDomain for domain "mydomain0.com" with permission "renew,transfer_out" and domain locked "true"
    When I visit Registration for domain "mydomain0.com"
    Then I should see "Want to transfer this domain to another registrar?"
    And I should see "This domain is currently locked. If you'd like to transfer this domain to another registrar, unlock this domain to receive the auth code."
    And I mock updateDomain returns status "ok"
    And I mock getDomain for domain "mydomain0.com" with permission "renew,transfer_out" and domain locked "false"
    When I follow "Unlock Domain"
    Then I should see "Domain Auth Code"

  Scenario: If my domain is unlocked I can lock my domain
    And I mock getDomain for domain "mydomain0.com" with permission "renew,transfer_out" and domain locked "false"
    When I visit Registration for domain "mydomain0.com"
    Then I should see "Want to transfer this domain to another registrar?"
    And I should see "Domain Auth Code"
    # And I should see "authCode123" within "#auth-code" # --- Changed this because auto code shows up in an input field
    And I mock updateDomain returns status "ok"
    And I mock getDomain for domain "mydomain0.com" with permission "renew,transfer_out" and domain locked "true"
    When I follow "Lock Domain"
    Then I should see "This domain is currently locked. If you'd like to transfer this domain to another registrar, unlock this domain to receive the auth code."
