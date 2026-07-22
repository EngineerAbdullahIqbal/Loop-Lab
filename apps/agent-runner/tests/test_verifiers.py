import unittest

from app.verifiers import contains, equals, is_checkable_goal, no_hype, word_count_at_most


class VerifierTests(unittest.TestCase):
    def test_word_count_at_most(self):
        self.assertTrue(word_count_at_most(3)("one two three").passed)
        r = word_count_at_most(2)("one two three")
        self.assertFalse(r.passed)
        self.assertIn("3 words", r.reasons[0])

    def test_equals(self):
        self.assertTrue(equals("32")(" 32 ").passed)
        self.assertFalse(equals("32")("31").passed)

    def test_contains(self):
        self.assertTrue(contains("cat")("a CAT sat").passed)
        self.assertFalse(contains("dog")("a cat sat").passed)

    def test_no_hype_gaming_guard(self):
        self.assertFalse(no_hype()("our REVOLUTIONARY thing").passed)
        self.assertFalse(no_hype()("a game changing tool").passed)  # space vs hyphen
        self.assertTrue(no_hype()("a plain simple thing").passed)

    def test_is_checkable_goal(self):
        self.assertTrue(is_checkable_goal("under 20 words"))
        self.assertTrue(is_checkable_goal("summarize in at most 3 bullets"))
        self.assertFalse(is_checkable_goal("make it good"))
        self.assertFalse(is_checkable_goal(""))


if __name__ == "__main__":
    unittest.main()
