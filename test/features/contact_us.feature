Feature: Contact Us

  Background:
    Given I logged in with mock data for domains and user info with 35 domain credits and 5 invites available
    Then I follow "Contact Us"

  @javascript
  Scenario: As a logged in user I want to see Contact Us page
    Then I should see "Contact Us"
    And I should see "Email: support@badger.com"
    And I should see "Phone: 415-787-5050"
    And I should see "Send us a message:"

  @javascript
  Scenario: I can send message through Contact Us page
    And I fill in "subject" with "Testing Subject"
    And I fill in "body" with "Test body"
    Given I mock sendEmail
    And I press "Send"
    Then I should see "Thank you. Your message has been sent."