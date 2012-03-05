Feature: Domain apps
  In order to manage apps
  As a logged-in user
  I want to view apps installed on domain and install new apps

  Background:
    Given I logged in with mock data for domains and user info with 35 domain credits and 5 invites available

  Scenario: View apps installed on domain
    And I mock getDomain with domain "mydomain0.com" and dns:
      |id |record_type|subdomain    |content                              |ttl |priority|
      |78 |A          |             |204.93.213.45                        |1800|        |
      |79 |CNAME      |www          |ea.myshopify.com                     |1800|        |
      |80 |A          |             |75.101.163.44                        |1800|        |
      |81 |A          |             |75.101.145.87                        |1800|        |
      |82 |A          |             |174.129.212.2                        |1800|        |
      |83 |CNAME      |www          |ea.heroku.com                        |1800|        |
      |84 |A          |             |184.106.20.102                       |1800|        |
      |85 |A          |             |66.6.44.4                            |1800|        |
      |86 |CNAME      |www          |domains.tumblr.com                   |1800|        |
      |87 |A          |             |216.239.32.21                        |1800|        |
      |88 |A          |             |216.239.34.21                        |1800|        |
      |89 |A          |             |216.239.36.21                        |1800|        |
      |90 |A          |             |216.239.38.21                        |1800|        |
      |91 |CNAME      |www          |ghs.google.com                       |1800|        |
      |92 |A          |             |184.73.237.244                       |1800|        |
      |93 |A          |www          |184.73.237.244                       |1800|        |
    When I follow "mydomain0.com"
    Then I should see "mydomain0.com" within "#content h1"
    And I should see "Installed Applications"
    And I should see "Available Applications"
    When I follow "SHOPIFY"
    Then I should see "SHOPIFY FOR mydomain0.com" within "#content h1"
    And I should see "Shopify DNS settings have successfully been installed into Badger DNS."
    When I follow "HEROKU"
    Then I should see "HEROKU FOR mydomain0.com" within "#content h1"
    And I should see "Heroku DNS settings have been installed into Badger DNS."
    And I should see "Also check out Heroku Custom Domains."
    When I follow "POSTEROUS"
    Then I should see "POSTEROUS FOR mydomain0.com" within "#content h1"
    And I should see "Posterous DNS settings have successfully been installed into Badger DNS."
    When I follow "TUMBLR"
    Then I should see "TUMBLR FOR mydomain0.com" within "#content h1"
    And I should see "Tumblr DNS settings have successfully been installed into Badger DNS."
    When I follow "BLOGGER"
    Then I should see "BLOGGER FOR mydomain0.com" within "#content h1"
    And I should see "Blogger DNS settings have successfully been installed into Badger DNS."
    When I follow "FLAVORS ME"
    Then I should see "FLAVORS ME FOR mydomain0.com" within "#content h1"
    And I should see "FlavorsMe DNS settings have successfully been installed into Badger DNS."
    When I follow "GOOGLE APP ENGINE"
    Then I should see "GOOGLE APP ENGINE FOR mydomain0.com" within "#content h1"
    And I should see "Google App Engine DNS settings have been installed into Badger DNS."
    And I should see "Also check out Google App Engine Custom Domains."

  Scenario: Install new app (Shopify)
    And I mock getDomain for domain "mydomain0.com"
    And I follow "mydomain0.com"
    When I click on item with xpath "(//a[@class='app_store_container'])[9]"
    Then I should see "Shopify for mydomain0.com"
    And I should see "DNS records to be installed"
    When I follow "DNS records to be installed"
    Then I should see "Subdomain" within "table:first"
    And I should see "Type" within "table:first"
    And I should see "Target" within "table:first"
    And I should see "mydomain0.com" within "table:first tr:eq(2)"
    And I should see "A" within "table:first tr:eq(2)"
    And I should see "204.93.213.45" within "table:first tr:eq(2)"
    And I should see "www.mydomain0.com" within "table:first tr:eq(3)"
    And I should see "CNAME" within "table:first tr:eq(3)"
    And I press "Install Shopify"
    And I should see "Shopify URL is invalid"
    And I fill in "shopify_app_url" with "google.com"
    And I press "Install Shopify"
    And I should see "Shopify URL is invalid"
    And I fill in "shopify_app_url" with "ea.myshopify.com"
    And I mock addRecord
    And I press "Install Shopify"
    Then I should see "SHOPIFY FOR mydomain0.com" within "#content h1"
    And I should see "Shopify DNS settings have successfully been installed into Badger DNS."

  Scenario: Install new app (Heroku)
    And I mock getDomain for domain "mydomain0.com"
    And I follow "mydomain0.com"
    When I click on item with xpath "(//a[@class='app_store_container'])[8]"
    Then I should see "Heroku for mydomain0.com"
    And I should see "DNS records to be installed"
    When I follow "DNS records to be installed"
    Then I should see "Subdomain" within "table:first"
    And I should see "Type" within "table:first"
    And I should see "Target" within "table:first"
    And I should see "mydomain0.com" within "table:first tr:eq(2)"
    And I should see "A" within "table:first tr:eq(2)"
    And I should see "75.101.163.44" within "table:first tr:eq(2)"
    And I should see "A" within "table:first tr:eq(3)"
    And I should see "75.101.145.87" within "table:first tr:eq(3)"
    And I should see "A" within "table:first tr:eq(4)"
    And I should see "174.129.212.2" within "table:first tr:eq(4)"
    And I should see "www.mydomain0.com" within "table:first tr:eq(5)"
    And I should see "CNAME" within "table:first tr:eq(5)"
    And I press "Install Heroku"
    Then I should see "Heroku Application URL is invalid"
    And I fill in "heroku_app_url" with "google.com"
    And I press "Install Heroku"
    Then I should see "Heroku Application URL is invalid"
    And I fill in "heroku_app_url" with "ea.heroku.com"
    And I mock addRecord
    And I press "Install Heroku"
    Then I should see "HEROKU FOR mydomain0.com" within "#content h1"
    And I should see "Heroku DNS settings have been installed into Badger DNS."

  Scenario: Install new app (Google Apps Verification)
    And I mock getDomain for domain "mydomain0.com"
    And I follow "mydomain0.com"
    When I click on item with xpath "(//a[@class='app_store_container'])[15]"
    Then I should see "Google Apps Verification for mydomain0.com"
    And I should see "DNS records to be installed"
    When I follow "DNS records to be installed"
    Then I should see "Subdomain" within "table:first"
    And I should see "Type" within "table:first"
    And I should see "Target" within "table:first"
    And I should see "mydomain0.com" within "table:first tr:eq(2)"
    And I should see "TXT" within "table:first tr:eq(2)"
    And I press "Install Google Apps Verification"
    Then I should see /The code you entered is invalid. Validation codes usually start with "google-site-verification"./
    And I fill in "google_app_verification_code" with "abcgoogle-site-verification:abcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcde"
    And I press "Install Google Apps Verification"
    Then I should see /The code you entered is invalid. Validation codes usually start with "google-site-verification"./
    And I fill in "google_app_verification_code" with "google-site-verification:abcdeabcdeabcdeabcdeabcdeabcdebcdeabcde1234"
    And I mock addRecord
    And I mock getDomain with domain "mydomain0.com" and dns:
      |id |record_type|subdomain    |content                              |ttl |priority|
      |80 |TXT        |             |google-site-verification:0123456     |1800|        |
    And I press "Install Google Apps Verification"
    Then I should see "GOOGLE APPS VERIFICATION FOR mydomain0.com" within "#content h1"
    And I should see "The TXT record below has been added to the DNS configuration for"

  Scenario: Install new app unsuccessfully because of conflicts
    And I mock getDomain with domain "mydomain0.com" and dns:
      |id |record_type|subdomain    |content                              |ttl |priority|
      |80 |A          |             |75.101.163.44                        |1800|        |
      |81 |A          |             |75.101.145.87                        |1800|        |
      |82 |A          |             |174.129.212.2                        |1800|        |
      |83 |CNAME      |www          |ea.heroku.com                        |1800|        |
    And I follow "mydomain0.com"
    When I click on item with xpath "(//a[@class='app_store_container'])[9]"
    And I fill in "shopify_app_url" with "ea.myshopify.com"
    And I mock addRecord
    When I press "Install Shopify"
    Then I should see "Shopify Installation Failed"
    And I should see "Installation failed due to conflict with the following app:"
    And I should see "Heroku" within "table:first tr"
    And I should see "Uninstall" within "table:first tr"
    And I mock deleteRecord
    When I follow "Uninstall"
    Then I should see "Heroku Was Uninstalled"
    And I should see "To continue installing Shopify, click the Install button below."
    When I follow "Install Shopify"
    Then I should see "Install Shopify Confirmation"
    And I should see "To install this application, click the Install button below."

  Scenario: Install new app unsuccessfully because of user custom dns conflicts
    And I mock getDomain with domain "mydomain0.com" and dns:
      |id |record_type|subdomain    |content                              |ttl |priority|
      |80 |A          |             |12.12.192.12                         |1800|        |
      |83 |CNAME      |www          |myweb.com                            |1800|        |
    And I follow "mydomain0.com"
    When I click on item with xpath "(//a[@class='app_store_container'])[9]"
    And I fill in "shopify_app_url" with "ea.myshopify.com"
    When I press "Install Shopify"
    Then I should see "Shopify Installation Failed"
    And I should see "Installation failed due to conflict with the following app:"
    And I should see "User Custom DNS"
    And I should see "Please remove these conflict DNS records in Badger DNS:"
    And I should see "www.mydomain0.com"
    And I should see "myweb.com"
    And I should see "12.12.192.12"

  Scenario: Install new app unsuccessfully because of spf txt dns conflicts
    And I mock getDomain with domain "mydomain0.com" and dns:
      |id |record_type|subdomain    |content                              |ttl |priority|
      |80 |TXT        |             |v=spf1 record1                       |1800|        |
      |81 |TXT        |mysubdomain  |v= record2                           |1800|        |
      |82 |TXT        |mysubdomain  |v=spf1 record3                       |1800|        |
      |83 |TXT        |             |v=spf1 mx mx:rhinonamesmail.com ~all |1800|        |
      |84 |MX         |             |smtp.badger.com                      |1800|10      |
      |85 |TXT        |             |google-site-verification:0123456     |1800|        |
    And I follow "mydomain0.com"
    When I click on item with xpath "(//a[@class='app_store_container'])[6]"
    When I press "Install Google Mail"
    Then I should see "Google Mail Installation Failed"
    And I should see "Installation failed due to conflict with the following apps:"
    And I should see "User Custom DNS"
    And I should see "Please remove this conflict DNS record in Badger DNS:"
    And I should see "v=spf1 record1"
    And I should not see "v= record2"
    And I should not see "v=spf1 record3"
    And I should see "Email Forwarding"
    And I should see "Uninstall"
