require 'capybara'
require 'capybara/dsl'
require 'capybara/cucumber'

Capybara.default_driver = :selenium
Capybara.default_wait_time = 1.0
Capybara.app_host = 'file://' + File.expand_path(File.dirname(__FILE__) + '/../../..')

def command?(command)
  system("which #{command} > /dev/null 2>&1")
end

Capybara.register_driver :selenium do |app|
  if ENV['HEADLESS'] == 'true'
    require 'headless'
    headless = Headless.new(:display => 98)
    headless.start
    at_exit { headless.destroy }

    Capybara::Selenium::Driver # this line ensures that the top level Selenium module is loaded
    if command?('google-chrome')
      browser, profile = :chrome, Selenium::WebDriver::Chrome::Profile.new
    elsif command?('firefox')
      browser, profile = :firefox, Selenium::WebDriver::Firefox::Profile.new
    else
      fail "Neither firefox nor google-chrome found in #{ENV['PATH']}"
    end
    profile['general.useragent.override'] = 'Selenium'
    Capybara::Selenium::Driver.new(app, :browser => browser, :profile => profile)
  else
    Capybara::Selenium::Driver.new(app, :browser => :chrome, :switches => ['--user-agent=Selenium'])
  end
end

World(Capybara)
