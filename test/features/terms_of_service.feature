Feature: Terms of Service
  In order to know terms of service
  As a logged-in user
  I want to view terms of service page

  Background:
    Given I logged in with mock data for domains and user info with 35 domain Credits and 5 invites available
    And I mock getTermsOfServices
    Then I follow "Terms of Service"

  Scenario: I want to see list terms of service
    And I should see "Credits Terms"
    And I should see "Anti Spam Policy"
    And I should see "Domain Privacy Services Agreement"
    And I should see "Domain Name Services Agreement"

  Scenario: I want to view detail of a terms of service
    And I mock getTermsOfService returns status "ok"
    And I follow "Credits Terms"
    Then I should see "This is Credit Terms"

  Scenario: I want to view a terms of service that is not valid
    And I mock getTermsOfService returns status "not_found"
    And I follow "Credits Terms"
    Then I should see "Terms of Service not found"
