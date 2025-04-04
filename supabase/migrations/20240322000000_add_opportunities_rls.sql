-- Enable RLS on opportunities table if not already enabled
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Submitters can view their own opportunities" ON opportunities;
DROP POLICY IF EXISTS "Admins can view all opportunities" ON opportunities;
DROP POLICY IF EXISTS "Submitters can create their own opportunities" ON opportunities;
DROP POLICY IF EXISTS "Admins can create opportunities" ON opportunities;
DROP POLICY IF EXISTS "Submitters can update their own opportunities" ON opportunities;
DROP POLICY IF EXISTS "Admins can update all opportunities" ON opportunities;
DROP POLICY IF EXISTS "Submitters can delete their own opportunities" ON opportunities;
DROP POLICY IF EXISTS "Admins can delete all opportunities" ON opportunities;

-- Create policies for submitters to view their own opportunities
CREATE POLICY "Submitters can view their own opportunities" ON opportunities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'submitter'
      AND opportunities.owner_id = auth.uid()
    )
  );

-- Create policies for admins to view all opportunities
CREATE POLICY "Admins can view all opportunities" ON opportunities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- Create policies for submitters to create their own opportunities
CREATE POLICY "Submitters can create their own opportunities" ON opportunities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'submitter'
      AND opportunities.owner_id = auth.uid()
    )
  );

-- Create policies for admins to create opportunities
CREATE POLICY "Admins can create opportunities" ON opportunities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- Create policies for submitters to update their own opportunities
CREATE POLICY "Submitters can update their own opportunities" ON opportunities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'submitter'
      AND opportunities.owner_id = auth.uid()
    )
  );

-- Create policies for admins to update all opportunities
CREATE POLICY "Admins can update all opportunities" ON opportunities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- Create policies for submitters to delete their own opportunities
CREATE POLICY "Submitters can delete their own opportunities" ON opportunities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'submitter'
      AND opportunities.owner_id = auth.uid()
    )
  );

-- Create policies for admins to delete all opportunities
CREATE POLICY "Admins can delete all opportunities" ON opportunities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  ); 