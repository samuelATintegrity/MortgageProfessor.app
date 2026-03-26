-- Utah Buyer title fees (from Lexi 8.4.xlsx Buyer tab)
INSERT INTO public.title_fee_schedules (state, fee_type, loan_amount_min, loan_amount_max, title_fee, escrow_fee) VALUES
('UT', 'buyer', 0, 100000, 425, 850),
('UT', 'buyer', 100001, 300000, 450, 850),
('UT', 'buyer', 300001, 750000, 575, 850),
('UT', 'buyer', 750001, 1000000, 625, 850),
('UT', 'buyer', 1000001, 1500000, 875, 850),
('UT', 'buyer', 1500001, 2000000, 1125, 850);

-- Utah Refinance title fees (from Refinance tab)
INSERT INTO public.title_fee_schedules (state, fee_type, loan_amount_min, loan_amount_max, title_fee, escrow_fee) VALUES
('UT', 'refinance', 0, 100000, 525, 850),
('UT', 'refinance', 100001, 250000, 675, 850),
('UT', 'refinance', 250001, 750000, 725, 850),
('UT', 'refinance', 750001, 2000000, 1350, 850),
('UT', 'refinance', 2000001, 2500000, 1500, 850);

-- Utah Seller title fees
INSERT INTO public.title_fee_schedules (state, fee_type, loan_amount_min, loan_amount_max, title_fee, escrow_fee) VALUES
('UT', 'seller', 0, 100000, 425, 850),
('UT', 'seller', 100001, 300000, 450, 850),
('UT', 'seller', 300001, 750000, 575, 850),
('UT', 'seller', 750001, 1000000, 625, 850),
('UT', 'seller', 1000001, 1500000, 875, 850),
('UT', 'seller', 1500001, 2000000, 1125, 850);
