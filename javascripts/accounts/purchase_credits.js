with (Hasher('Billing','Application')) {

  route('#account/billing/credits', function() {
    var necessary_credits = Badger.Session.read('necessary_credits') || 0;
    
    var saved_or_new_card_div = div(
      fieldset(
        label({ 'for': 'payment_method_id' }, 'Saved cards:'),
        select(option('Loading...'))
      )
    );
    
    render(
      h1('Purchase Credits'),

      div({ 'class': 'sidebar' },
        info_message(
          h3("What's a credit include?"),
          ul({ style: "padding-left: 20px" },
            li('1 year of registration'),
            li('and WHOIS privacy (free)'),
            li('and DNS hosting (free)')
          ),
          p("New registrations, transfers and renewals all cost 1 credit.")
        ),
        
        info_message(
          h3("Why do you use credits?"),
          p("Credits allow us to give you discounts by purchasing in bulk and make future registrations and renewals faster and easier.")
        )
      ),

      form_with_loader({ 'class': 'fancy has-sidebar', id: 'credits-form', action: purchase_credits, loading_message: "Processing purchase..." },
        div({ id: 'modal-errors' },
          (necessary_credits ?
            div({ 'class': 'error-message' }, "You need at least ", necessary_credits, " Credits to continue.")
          : [])
        ),

        div({ style: 'height: 132px;' },
          div({ style: 'float: right; width: 300px'}, credits_table()),
    
          fieldset({ style: 'padding-top: 18px' },
            label({ 'for': 'credits-input' }, 'How many credits:'),
  					credits_selector(necessary_credits)
  				),

          fieldset(
            label({ 'for': 'first_name-input' }, 'Total cost:'),
            span({ id: 'static-price', style: 'font-size: 30px' }, '')
          )
        ),
        
        saved_or_new_card_div,

        fieldset({ 'class': 'no-label' },
          submit({ id: 'purchase-button', value: 'Purchase Credits' })
        )
				
      )
    );

		// determine which tier to select first
		var credits = $("#credits-form").find("input[name=credits]").val()
		if (credits == 1) {
			$("#credit-tier-1").css({ "background": "#CDEC96", "border-width": "3px" });
		} else if (credits >= 2 && credits <= 9) {
			$("#credit-tier-2").css({ "background": "#CDEC96", "border-width": "3px" });
		} else {
			$("#credit-tier-10").css({ "background": "#CDEC96", "border-width": "3px" });
		}
		
		$("#credits-form").find("input[name=credits]").focus();
		$("#credits-form").find("input[name=credits]").select();
		$("input[name=credits]").trigger("keyup");

    // asynch load payment methods
    BadgerCache.getPaymentMethods(function(response) {
      var payment_methods = response.data;
      
      render({ into: saved_or_new_card_div },
        fieldset(
          label({ 'for': 'payment_method_id' }, 'Saved cards:'),
          select({ id: 'payment_method_id', name: 'payment_method_id', events: { change: hide_or_show_new_card_fields }},
            payment_methods.map(function(payment_method) {
              return option({ value: payment_method.id }, payment_method.name)
            }),
            option({ value: '0' }, 'New card')
          ),
          
          span({ id: 'save_card_container' },
            input({ type: 'checkbox', name: 'save_card', checked: 'checked', style: 'margin-left: 20px', id: 'save_card-checkbox' }), 
            label({ 'class': 'normal', 'for': 'save_card-checkbox'  }, ' Keep this card on file')
          )
        ),

        div({ id: 'new_card_container' },

          fieldset(
            label({ 'for': 'first_name-input' }, 'Name on card:'),
            text({ 'class': 'short right-margin', name: 'first_name', placeholder: 'John', id: 'first_name-input' }),
            text({ 'class': 'short', name: 'last_name', placeholder: 'Doe' })
          ),

          fieldset(
            label({ 'for': 'street_address-input' }, 'Billing address:'),
            input({ name: 'street_address', placeholder: '123 Main St.', id: 'street_address-input' })
          ),

          // input({ name: 'extended_address', placeholder: 'Address Line 2 (Optional)', style: "width: 240px; margin: 2px"  })

          fieldset(
            label({ 'for': 'city-input' }, 'City, state and zip:'),
            input({ 'class': 'short right-margin', name: 'city', placeholder: 'San Francisco', id: 'city-input' }),
            input({ 'class': 'supershort right-margin', name: 'state', placeholder: 'CA' }),
            input({ 'class': 'supershort', name: 'zip', placeholder: '94104' })
          ),

          fieldset(
            label({ 'for': 'country_input' }, 'Country:'),
            select({ name: 'country_name', id: 'country_input' }, option(''), country_options())
          ),

          fieldset(
            label({ 'for': 'cc_number-input' }, 'Card number:'),
            input({ name: 'cc_number', id: 'cc_number-input', placeholder: 'XXXX-XXXX-XXXX-XXXX' })
          ),

          fieldset(
            label({ 'for': 'cc_cvv-input' }, 'Security code:'),
            input({ name: 'cc_cvv', id: 'cc_cvv-input', placeholder: '123', style: 'width: 40px' })
          ),

          fieldset(
            label({ 'for': 'expiration_month-input' }, 'Expiration:'),
            select({ name: 'cc_expiration_date_month', id: 'expiration_month-input', style: 'width: 46px' },
              option({ value: '01' }, '01 - January'),
              option({ value: '02' }, '02 - February'),
              option({ value: '03' }, '03 - March'),
              option({ value: '04' }, '04 - April'),
              option({ value: '05' }, '05 - May'),
              option({ value: '06' }, '06 - June'),
              option({ value: '07' }, '07 - July'),
              option({ value: '08' }, '08 - August'),
              option({ value: '09' }, '09 - September'),
              option({ value: '10' }, '10 - October'),
              option({ value: '11' }, '11 - November'),
              option({ value: '12' }, '12 - December')
            ),
            '/',
            select({ name: 'cc_expiration_date_year' },
              option('2012'),
              option('2013'),
              option('2014'),
              option('2015'),
              option('2016'),
              option('2017'),
              option('2018'),
              option('2019'),
              option('2020')
            )
          )
        )
      );

      hide_or_show_new_card_fields();
    });
  });
  
  
  // reads from Badger.Session to get the number of credits just added to the account,
  // and renders and info message into the div
  define('render_num_credits_added', function() {
    var arguments = flatten_to_array(arguments);
    var options = shift_options_from_args(arguments);
    
    if (credits_added = (options.delete_var) ? Badger.Session.delete('credits_added') : Badger.Session.read('credits_added')) {
      var message = info_message("You have added ", credits_added, " ", credits_added <= 1 ? "credit" : "credits", " to your account.");

      // if an into is passed, render into it. otherwise, just return a div of the message in place.
      if (options.into) {
        render(options, message)
      } else {
        return div(options, message);
      }
    }
  });
  

  define('hide_or_show_new_card_fields', function() {
    if ($('#payment_method_id').val() == '0') {
      $('#payment_method_id').css('width','100px');
      $('#save_card_container,#new_card_container').show();
    } else {
      $('#payment_method_id').css('width','auto')
      $('#save_card_container,#new_card_container').hide();
    }
  });
  
  //$('#save_card_container,#new_card_container')
  
  define('purchase_credits', function(form_data) {
    if (form_data.credits == '1' && form_data.credits_variable) form_data.credits = form_data.credits_variable;
    delete form_data.credits_variable;

    $('#modal-errors').empty();
    start_modal_spin('Processing payment...');

    Badger.purchaseCredits(form_data, function(response) {
      if (response.meta.status == 'ok') {
        BadgerCache.reload('account_info');
        BadgerCache.reload('payment_methods');
        
        // save the number of credits that were just purchased to show a customized message
        Badger.Session.write({
          credits_added: Badger.Session.delete('necessary_credits')
        });
        
        BadgerCache.getAccountInfo(function(response) {
          update_credits();
          
          // if a redirect url was explicitly set to null, don't perform the default redirect
          if (Badger.Session.read('redirect_url') != null) {
            set_route(Badger.Session.delete('redirect_url') || '#account/billing');
          }
          
          // if a callback was provided, pull that off and execute it
          if (callback = Badger.Session.delete('callback')) callback();
        });
      } else {
        $('#modal-errors').empty().append(error_message(response));
        hide_form_submit_loader();
      }
    });
  });

	define('credits_selector', function(necessary_credits) {
		// var necessary_credits = typeof(necessary_credits) == "undefined" ? 0 : parseInt(necessary_credits);
		
		var credit_selector = div({ id: "credits-selector" },
			input({ style: "font-size: 30px; text-align: center; width: 50px", name: "credits", id: 'credits-input', maxlength: 3, value: necessary_credits > 0 ? necessary_credits : 1, size: "2" })
		);
		
		jQuery.fn.ForceNumericOnly = function() {
			return this.each(function()
			{
				$(this).keydown(function(e) {
					var key = e.charCode || e.keyCode || 0;
					// allow backspace, tab, delete, arrows, numbers and keypad numbers ONLY
					return (
						key == 8 || 
						key == 9 ||
						key == 46 ||
						(key >= 37 && key <= 40) ||
						(key >= 48 && key <= 57) ||
						(key >= 96 && key <= 105)
					);
				});
			});
		};
		
		$(credit_selector).find('input').ForceNumericOnly();

		var tier; //track the credit tier		
		var previous_tier = 1;
		var num_credits = 0;
		
		var updateCreditsFieldsAndTierSelected = function(inputField, force) {
			force = typeof(force) == 'undefined' ? false : force;
			
			if ( $(inputField).val() ) {
				num_credits = parseInt($(inputField).val());
			} else {
				num_credits = 0;
			}
			
			var price = 0;
			if ( num_credits == 1) {
				price = 12;
				tier = 1;
			} else if ( num_credits >= 2 && num_credits <= 9 ) {
				price = 11;
				tier = 2;
			} else if ( num_credits >= 10 ) {
				price = 10;
				tier = 10;
			} else {
				price = 0;
				tier = -1;
			}
			
			//update the price fields
			$('#price-each').empty().append("$" + price.toString());
			$('#price-total').empty().append("$" + (price * num_credits).toString());
			$('#price-savings').empty().append("$" + (num_credits*15 - price*num_credits).toString())				
	
			// change text on the purchase button
			$("#purchase-button").attr("value", "Purchase " + num_credits + (num_credits == 1 ? " credit" : " credits") + " for $" + (price*num_credits));
			$("#static-price").html("$" + (price*num_credits));
			
			// how/hide savings
			if (num_credits >= 2) {
				$("#savings").show();
			} else {
				$("#savings").hide();
			}

			//change the tier hilighting if changed
			if ( tier == -1 ) {
				$("#credit-tier-" + previous_tier).css({ "background": "#E6F8D8", "border-width": "1px" }); // change back to unselected
			} else {
				$("#credit-tier-" + tier).css({ "background": "#CDEC96", "border-width": "3px" }); // the selected color
				if (tier != previous_tier) {
					$("#credit-tier-" + previous_tier).css({ "background": "#E6F8D8", "border-width": "1px" }); // change back to unselected
				}
			}
			
			pervious_num_credits = num_credits;
			previous_tier = tier;
		};
		
		$(credit_selector).find('input[name=credits]').keyup(function(e) {
			if( $(this).is(":focus") ) {
				updateCreditsFieldsAndTierSelected(this);
			}
		});
		
		// update fields on page load
		$(function() {
			updateCreditsFieldsAndTierSelected($(credit_selector).find('input[name=credits]'), true);
		});
		
		return credit_selector;
	});
	
	define('update_credits_input_with', function(num_credits) {
		$('input[name=credits]').val(num_credits);
		$('input[name=credits]').select();
		$('input[name=credits]').focus();
		$('input[name=credits]').trigger("keyup", true);
	});

	define('credits_tier', function(min_credits, max_credits, price, savings_message) {
		return a({ href: curry(update_credits_input_with, min_credits), style: "text-decoration: none" },
			div({ id: ("credit-tier-" + min_credits.toString()), 'class': 'success-message', style: "padding: 10px 5px 10px 5px; color: black; text-align: center; height: 100px; width: 70px; margin-bottom: 0" },
				div({ style: "font-size: 16px; font-weight: bold;" }, (min_credits == max_credits) ? min_credits.toString() : min_credits.toString() + (max_credits == null ? "+" : "-" + max_credits.toString())),
				div({ style: "font-size: 14px" }, (min_credits == max_credits) ? "Credit" : "Credits"),
				div({ style: "font-size: 20px; font-weight: bold; padding-top: 8px" }, price),
				div({ style: "font-size: 12px; padding-bottom: 6px" }, "each"),
				(function() { typeof(savings_message) == 'undefined' ? null : div({ style: "font-size: 12px" }, "each") })(),
				(function() {
					if ( typeof(savings_message) == 'string' ) {
						return div(
							div({ style: "color: red" }, savings_message)
						)
					}
				})()
			)
		)
	}); 

  define('credits_table', function() {
    return div({ id: "credits-table" },
			table( tbody(
				tr(
					td(
						credits_tier(1, 1, "$12")
					),
					td(
						credits_tier(2, 9, "$11", "8% off")
					),
					td(
						credits_tier(10, null, "$10", "16% off")
					)
				)
			))
		);
	});  
}
