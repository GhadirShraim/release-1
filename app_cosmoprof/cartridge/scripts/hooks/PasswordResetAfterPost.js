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

function PasswordResetafterPost(customer, resetToken) {
	var staus : Status = new dw.system.Status(dw.system.Status.OK);
	 var variables: Map = new dw.util.HashMap();
 	 variables.put("Customer", customer);
	 variables.put("ResetPasswordToken", resetToken);
 	 var template: Template = new dw.util.Template("mail/resetpasswordemail.isml");
	 var content: MimeEncodedText = template.render(variables);
	 var mail: Mail = new Mail().setSubject(dw.web.Resource.msg('passwordemail.subject','account',null)).setContent(content).setFrom("customerservice@cosmoprofbeauty.com").addTo(customer.profile.email);
	 mail.send();
	 return staus;
}

exports.afterPOST = PasswordResetafterPost;	