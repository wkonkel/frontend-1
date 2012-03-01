require 'capybara'
require 'capybara/dsl'
require 'capybara/cucumber'

Capybara.default_driver = :selenium
Capybara.default_wait_time = 0.5
Capybara.app_host = 'file://' + File.expand_path(File.dirname(__FILE__) + '/../../..')

Capybara.register_driver :selenium do |app|
  if ENV['HEADLESS'] == 'true'
    require 'headless'
    headless = Headless.new(:reuse => false)
    headless.start
    at_exit { headless.destroy }

    Capybara::Selenium::Driver # this line ensures that the top level Selenium module is loaded
    profile = Selenium::WebDriver::Firefox::Profile.new
    profile['general.useragent.override'] = 'Selenium'
    Capybara::Selenium::Driver.new(app, :browser => :firefox, :profile => profile)
  else
    Capybara::Selenium::Driver.new(app, :browser => :chrome, :switches => ['--user-agent=Selenium'])
  end
end

World(Capybara)
