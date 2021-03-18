/**
* Demandware Script File
* To define input and output parameters, create entries of the form:
*
* @<paramUsageType> <paramName> : <paramDataType> [<paramComment>]
*
* where
*   <paramUsageType> can be either 'input' or 'output'
*   <paramName> can be any valid parameter name
*   <paramDataType> identifies the type of the parameter
*   <paramComment> is an optional comment
*
* For example:
*
*-   @input ExampleIn : String This is a sample comment.
*-   @output ExampleOut : Number
*
*/
importPackage( dw.system );
importPackage( dw.util );
importPackage( dw.net );
importPackage( dw.value);
importPackage( dw.customer);

function AuthAfterPost(customer , authRequestType) {
	var staus : Status = new dw.system.Status(dw.system.Status.OK);
	try {
	if(!empty(customer) && !empty(customer.profile) && !empty(customer.profile.addressBook)) {
		var addressBook : AddressBook = customer.profile.addressBook;
		var activeShippingAddres = 'activeShipAddressID' in customer.profile.custom && !empty(customer.profile.custom.activeShipAddressID) ? customer.profile.custom.activeShipAddressID : "";
		if (!empty(activeShippingAddres)) {
			var Transaction = require('dw/system/Transaction');	 //Wrap for Transactional call to update Customer profile
			Transaction.wrap(function () {			
			var getActiveAddr =  customer.getAddressBook().getAddress(activeShippingAddres);
			addressBook.setPreferredAddress(getActiveAddr);
			
			//SDD feature and new inventory logic activation
			var newInventoryLogicEnabled : Boolean = dw.system.Site.getCurrent().getCustomPreferenceValue("newInventoryLogicEnabled");
			if(newInventoryLogicEnabled) {
				
				var inventoryListData = dw.system.Site.getCurrent().getCustomPreferenceValue('inventoryListID_Mapping');
				
				if(inventoryListData) {
					
					var inventoryMap = JSON.parse(inventoryListData);
					var inventoryListID = '';
					
					if (inventoryMap[getActiveAddr.stateCode]) {
						inventoryListID = inventoryMap[getActiveAddr.stateCode];
						if(!dw.catalog.ProductInventoryMgr.getInventoryList(inventoryListID)) {
							inventoryListID = '';
						}
					}
					
					if (empty(inventoryListID) && inventoryMap[getActiveAddr.countryCode.value]) {
						inventoryListID = inventoryMap[getActiveAddr.countryCode];
						if(!dw.catalog.ProductInventoryMgr.getInventoryList(inventoryListID)) {
							inventoryListID = '';
						}
					}
					
					if (empty(inventoryListID) && dw.system.Site.current.ID == 'CosmoProf') {
						inventoryListID = inventoryMap['US_Default'];
						if(!dw.catalog.ProductInventoryMgr.getInventoryList(inventoryListID)) {
							inventoryListID = '';
						}
					}
					
					if (empty(inventoryListID) && dw.system.Site.current.ID == 'CosmoProf-CA') {
						inventoryListID = inventoryMap['CA_Default'];
						if(!dw.catalog.ProductInventoryMgr.getInventoryList(inventoryListID)) {
							inventoryListID = '';
						}
					} 
					if(inventoryListID) {
						customer.profile.custom.inventoryListID = inventoryListID;
					} else {
						customer.profile.custom.inventoryListID = '';
					}
				}
			}
		});
		}			
		}
	
	//Call Account Sync pipeline by passing customer object.
	if (!empty(customer) && !empty(customer.profile)) {
		let Pipeline = require('dw/system/Pipeline');
		let pdict = Pipeline.execute('Account-AccountSync', {
			 Customer: customer
		});	
	}
	} catch(err) {
		Logger.error("AuthAfterPost.js[afterPOST] : " + err.toString());
	}

	 return staus;
}

exports.afterPOST = AuthAfterPost;	