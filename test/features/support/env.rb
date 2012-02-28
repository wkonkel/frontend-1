require 'capybara'
require 'capybara/dsl'
require 'capybara/cucumber'

if ENV['HEADLESS'] == 'true'
  require 'headless'

  headless = Headless.new
  headless.start

  at_exit do
    headless.destroy
  end
end

Capybara.default_driver = :selenium
Capybara.default_wait_time = 0.5

Capybara.register_driver :selenium do |app|
  Capybara::Selenium::Driver.new(app, :browser => :chrome, :switches => ['--user-agent=Selenium'])
end
Capybara.app_host = 'file://' + File.expand_path(File.dirname(__FILE__) + '/../../..')
World(Capybara)

