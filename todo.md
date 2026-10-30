# Todo

- the user should be created if the user is not logged in while making the payment. before making payment we are accepting the user's info, so use the info to create the user.
- create a admim page where the admin can add products and see orders and the admin user must logged in.
- Enhance the UI, make it apple like add depth to the buttons and make it feel more premium.
- on the razorpay payment page the name is being shown correctly but the logo is showing of a product so it should be fixed. and the description of the product is also showing which should not be the case, the total amount should be shown and the currency should be INR, the amount should be written in words also.
- on the checkout page if the user is not logged in then show the google signin button to log the user in on the same page, the user should return on the same page after the login. and if the user is logged in then show the user's info and ask for the address (keep the address as the seperate collection in mongodb with the user's id as the refrence). or show the previously entered addresses to the user to select from and enter new address only if needed.
- while adding address give proper validation on the fields, for example for pincode check the length and if the value in the field is not a number alert the user. for phone number check the length and if the value in the field is not a number alert the user.
- the user profile page should show the user's info, his orders and his addresses. the user can delete his info and orders and addresses. the admin should have the authority to delete the user's info and orders and addresses. the admin can edit the products, orders and addresses. the user can only edit his own info and addresses.
- 