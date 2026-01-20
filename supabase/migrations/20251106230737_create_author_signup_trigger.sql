/*
  # Create Author Account on Auth Signup

  1. Function
    - `handle_new_user()` - Automatically creates an authors record when a new auth user signs up
    - Copies email from auth.users to authors.email
    - Sets default values for new authors

  2. Trigger
    - Executes after INSERT on auth.users
    - Calls handle_new_user() function

  3. Important Notes
    - The authors.id will match auth.users.id (same UUID)
    - New authors start with subscription_status = 'trial'
    - is_approved defaults to true (can be changed to false for manual approval)
    - is_grendel_press defaults to false (will be set true via invite code)
*/

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.authors (
    id,
    email,
    display_name,
    bio,
    is_grendel_press,
    subscription_status,
    is_super_admin,
    is_approved
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    '',
    false,
    'trial',
    false,
    true
  );
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.authors TO supabase_auth_admin;